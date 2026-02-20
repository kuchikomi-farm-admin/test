-- ============================================================
-- link_invite_code: OAuth 新規登録後に招待コードを後付けリンク
-- ============================================================

create or replace function link_invite_code(input_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_record record;
  caller_id uuid := auth.uid();
begin
  -- 既にリンク済みならスキップ
  if exists (
    select 1 from profiles
    where id = caller_id and invited_by is not null
  ) then
    return jsonb_build_object('success', true, 'message', 'already_linked');
  end if;

  -- 招待コード検証
  select ic.id, ic.created_by
  into invite_record
  from invite_codes ic
  where ic.code = upper(input_code)
    and ic.is_used = false
    and (ic.expires_at is null or ic.expires_at > now());

  if invite_record is null then
    return jsonb_build_object('success', false, 'message', 'invalid_code');
  end if;

  -- profiles.invited_by を更新
  update profiles
  set invited_by = invite_record.created_by
  where id = caller_id;

  -- 招待コードを使用済みに
  update invite_codes
  set is_used = true, used_by = caller_id
  where id = invite_record.id;

  -- 招待実績を更新
  update referrals
  set referred_id = caller_id, registered_at = now()
  where invite_code_id = invite_record.id
    and referred_id is null;

  return jsonb_build_object('success', true, 'message', 'linked');
end;
$$;

grant execute on function link_invite_code(text) to authenticated;
