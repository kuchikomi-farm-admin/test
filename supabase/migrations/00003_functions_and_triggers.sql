-- ============================================================
-- TheJapanLocalMedia: RPC Functions & Auth Triggers
-- ============================================================

-- 0. is_admin() — RLS用 admin判定 (security definer で再帰回避)
-- ============================================================
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

grant execute on function is_admin() to authenticated;

-- 1. verify_invite_code — 招待コード検証 (匿名アクセス可)
-- ============================================================
create or replace function verify_invite_code(input_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_record record;
begin
  select ic.*, p.display_name as ref_name
  into invite_record
  from invite_codes ic
  join profiles p on p.id = ic.created_by
  where ic.code = upper(input_code)
    and ic.is_used = false
    and (ic.expires_at is null or ic.expires_at > now());

  if invite_record is null then
    return jsonb_build_object('valid', false);
  end if;

  return jsonb_build_object(
    'valid', true,
    'referrer_name', invite_record.ref_name
  );
end;
$$;

grant execute on function verify_invite_code(text) to anon;
grant execute on function verify_invite_code(text) to authenticated;

-- 2. handle_new_user — auth.users 作成後に profiles を自動作成
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_code_record record;
begin
  -- 招待コードから紹介者を取得
  select id, created_by into invite_code_record
  from invite_codes
  where code = upper(new.raw_user_meta_data->>'invite_code')
  limit 1;

  -- profiles 作成
  insert into profiles (
    id, display_name, email, screening_answer, invited_by
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    new.email,
    new.raw_user_meta_data->>'screening_answer',
    invite_code_record.created_by
  );

  -- 招待コードを使用済みに
  if invite_code_record.id is not null then
    update invite_codes
    set is_used = true, used_by = new.id
    where id = invite_code_record.id;
  end if;

  -- 招待枠を初期化
  insert into invite_slots (user_id, initial_slots)
  values (new.id, 2);

  -- 通知設定を初期化
  insert into notification_preferences (user_id)
  values (new.id);

  -- 枠解放条件を初期化
  insert into slot_unlock_conditions (user_id, condition)
  values
    (new.id, 'content_views_3'),
    (new.id, 'profile_completed'),
    (new.id, 'first_share'),
    (new.id, 'feedback_sent');

  -- 招待実績を更新
  if invite_code_record.id is not null then
    update referrals
    set referred_id = new.id, registered_at = now()
    where invite_code_id = invite_code_record.id
      and referred_id is null;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 3. admin_user_stats — 管理者用ユーザー統計ビュー
-- ============================================================
create or replace view admin_user_stats as
select
  p.id,
  p.display_name as name,
  p.email,
  p.status,
  p.rank,
  p.role,
  p.created_at as join_date,
  coalesce(r.click_count, 0)::int as clicks,
  coalesce(r.registration_count, 0)::int as registrations,
  coalesce(r.registration_count, 0)::int as referrals
from profiles p
left join lateral (
  select
    count(*) as click_count,
    count(referred_id) as registration_count
  from referrals
  where referrer_id = p.id
) r on true;
