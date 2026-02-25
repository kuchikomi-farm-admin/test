-- ============================================================
-- TheJapanLocalMedia: Fix handle_new_user trigger
-- "Database error saving new user" エラーの修正
-- ============================================================
-- 適用方法: Supabase Dashboard > SQL Editor にこのファイルの内容を貼り付けて実行

-- 1. generate_member_id を堅牢化
--    非標準 member_id (JK-XXXXX以外) が存在しても安全に動作
-- ============================================================
CREATE OR REPLACE FUNCTION generate_member_id()
RETURNS trigger AS $$
DECLARE
  v_next_id int;
BEGIN
  SELECT coalesce(
    max(
      CASE
        WHEN member_id ~ '^JK-[0-9]+$'
        THEN substring(member_id from 4)::int
        ELSE 0
      END
    ), 0
  ) + 1
  INTO v_next_id
  FROM profiles;

  new.member_id := 'JK-' || lpad(v_next_id::text, 5, '0');

  -- 万が一重複した場合のリトライ
  WHILE EXISTS (SELECT 1 FROM profiles WHERE member_id = new.member_id) LOOP
    v_next_id := v_next_id + 1;
    new.member_id := 'JK-' || lpad(v_next_id::text, 5, '0');
  END LOOP;

  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 2. handle_new_user を堅牢化
--    - 各操作にエラーハンドリング追加
--    - 招待コード生成失敗はユーザー登録をブロックしない
--    - invited_by の FK 制約違反を防止
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_code_record record;
  v_referrer_id uuid;
  v_new_code text;
  v_attempts int := 0;
BEGIN
  -- 招待コードから紹介者を取得（新旧フォーマット両対応）
  BEGIN
    SELECT id, created_by INTO invite_code_record
    FROM invite_codes
    WHERE (code = upper(new.raw_user_meta_data->>'invite_code')
           OR code = lower(new.raw_user_meta_data->>'invite_code'))
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    invite_code_record := NULL;
    RAISE LOG '[handle_new_user] invite_code lookup failed: %', SQLERRM;
  END;

  -- referrer の profile 存在を確認してから invited_by に設定（FK 制約違反防止）
  IF invite_code_record IS NOT NULL AND invite_code_record.created_by IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM profiles WHERE id = invite_code_record.created_by) THEN
      v_referrer_id := invite_code_record.created_by;
    ELSE
      RAISE LOG '[handle_new_user] referrer profile not found: %', invite_code_record.created_by;
    END IF;
  END IF;

  -- profiles 作成（必須：失敗時はトリガー全体を失敗させる）
  INSERT INTO profiles (
    id, display_name, email, screening_answer, invited_by
  ) VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    new.email,
    new.raw_user_meta_data->>'screening_answer',
    v_referrer_id
  );

  -- 招待枠を初期化（失敗してもユーザー登録は続行）
  BEGIN
    INSERT INTO invite_slots (user_id, initial_slots)
    VALUES (new.id, 2)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[handle_new_user] invite_slots insert failed: %', SQLERRM;
  END;

  -- 通知設定を初期化（失敗してもユーザー登録は続行）
  BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[handle_new_user] notification_preferences insert failed: %', SQLERRM;
  END;

  -- 枠解放条件を初期化（失敗してもユーザー登録は続行）
  BEGIN
    INSERT INTO slot_unlock_conditions (user_id, condition)
    VALUES
      (new.id, 'content_views_3'),
      (new.id, 'profile_completed'),
      (new.id, 'first_share'),
      (new.id, 'feedback_sent')
    ON CONFLICT (user_id, condition) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[handle_new_user] slot_unlock_conditions insert failed: %', SQLERRM;
  END;

  -- 招待実績を記録（失敗してもユーザー登録は続行）
  IF invite_code_record IS NOT NULL AND invite_code_record.id IS NOT NULL AND v_referrer_id IS NOT NULL THEN
    BEGIN
      INSERT INTO referrals (referrer_id, referred_id, invite_code_id, registered_at)
      VALUES (v_referrer_id, new.id, invite_code_record.id, now());
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG '[handle_new_user] referrals insert failed: %', SQLERRM;
    END;
  END IF;

  -- 新規ユーザー用の永続招待コード自動生成（失敗してもユーザー登録は続行）
  BEGIN
    LOOP
      v_new_code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM invite_codes WHERE code = v_new_code);
      v_attempts := v_attempts + 1;
      IF v_attempts > 10 THEN EXIT; END IF;
    END LOOP;

    IF v_new_code IS NOT NULL THEN
      INSERT INTO invite_codes (code, created_by, is_used)
      VALUES (v_new_code, new.id, false);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[handle_new_user] invite_code generation failed: %', SQLERRM;
  END;

  RETURN new;
END;
$$;

-- 3. verify_invite_code を再適用（新旧フォーマット両対応 + click_count++）
-- ============================================================
CREATE OR REPLACE FUNCTION verify_invite_code(input_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record record;
BEGIN
  SELECT ic.*, p.display_name AS ref_name
  INTO invite_record
  FROM invite_codes ic
  JOIN profiles p ON p.id = ic.created_by
  WHERE (ic.code = upper(input_code) OR ic.code = lower(input_code))
    AND (ic.expires_at IS NULL OR ic.expires_at > now());

  IF invite_record IS NULL THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  -- クリック数をインクリメント
  UPDATE invite_codes SET click_count = click_count + 1 WHERE id = invite_record.id;

  RETURN jsonb_build_object(
    'valid', true,
    'referrer_name', invite_record.ref_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION verify_invite_code(text) TO anon;
GRANT EXECUTE ON FUNCTION verify_invite_code(text) TO authenticated;

-- 4. generate_invite_code を再適用（永続コード対応）
-- ============================================================
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_existing text;
  v_code text;
  v_attempts int := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', '未認証です');
  END IF;

  -- 既存の招待コードを返す（永続リンク）
  SELECT code INTO v_existing
  FROM invite_codes
  WHERE created_by = v_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('code', v_existing);
  END IF;

  -- コードがない場合は新規生成（8文字小文字英数字）
  LOOP
    v_code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM invite_codes WHERE code = v_code);
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RETURN jsonb_build_object('error', 'コード生成に失敗しました');
    END IF;
  END LOOP;

  INSERT INTO invite_codes (code, created_by, is_used)
  VALUES (v_code, v_user_id, false);

  RETURN jsonb_build_object('code', v_code);
END;
$$;

GRANT EXECUTE ON FUNCTION generate_invite_code() TO authenticated;

-- 5. click_count カラムが存在しない場合に追加
-- ============================================================
ALTER TABLE invite_codes ADD COLUMN IF NOT EXISTS click_count INTEGER NOT NULL DEFAULT 0;
