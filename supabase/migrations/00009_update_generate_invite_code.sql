-- ============================================================
-- TheJapanLocalMedia: generate_invite_code() RPC Update
-- ============================================================
-- 招待コード生成関数の更新（または再作成）
-- 変更点: invite_slots が存在しない場合に自動初期化するロジックを追加

create or replace function generate_invite_code()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_slots   record;
  v_existing text;
  v_code    text;
  v_attempts int := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('error', '未認証です');
  end if;

  -- 1. invite_slots から残枠を確認（なければ自動初期化）
  select * into v_slots
  from invite_slots
  where user_id = v_user_id
  for update;  -- 行ロックで race condition 防止

  if v_slots is null then
    -- 招待枠が未初期化の場合、デフォルト枠(2)で自動作成
    insert into invite_slots (user_id, initial_slots, bonus_slots, used_slots)
    values (v_user_id, 2, 0, 0)
    on conflict (user_id) do nothing;

    select * into v_slots
    from invite_slots
    where user_id = v_user_id
    for update;
  end if;

  if v_slots.initial_slots + v_slots.bonus_slots - v_slots.used_slots <= 0 then
    return jsonb_build_object('error', '招待枠がありません');
  end if;

  -- 2. 未使用の招待コードが既にあれば、そのコードを返す（重複生成防止）
  select code into v_existing
  from invite_codes
  where created_by = v_user_id and is_used = false
  order by created_at desc
  limit 1;

  if v_existing is not null then
    return jsonb_build_object('code', v_existing);
  end if;

  -- 3. XXXX-XXXX-XXXX 形式のユニークコード生成（大文字英数字）
  loop
    v_code := upper(
      substr(replace(gen_random_uuid()::text, '-', ''), 1, 4) || '-' ||
      substr(replace(gen_random_uuid()::text, '-', ''), 1, 4) || '-' ||
      substr(replace(gen_random_uuid()::text, '-', ''), 1, 4)
    );

    -- ユニーク性チェック
    exit when not exists (select 1 from invite_codes where code = v_code);

    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      return jsonb_build_object('error', 'コード生成に失敗しました。再度お試しください');
    end if;
  end loop;

  -- 4. invite_codes に INSERT
  insert into invite_codes (code, created_by)
  values (v_code, v_user_id);

  -- 5. invite_slots.used_slots をインクリメント
  update invite_slots
  set used_slots = used_slots + 1
  where user_id = v_user_id;

  -- 6. 生成したコードを返却
  return jsonb_build_object('code', v_code);
end;
$$;

grant execute on function generate_invite_code() to authenticated;
