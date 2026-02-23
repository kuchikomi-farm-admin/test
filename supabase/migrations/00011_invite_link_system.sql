-- ============================================================
-- TheJapanLocalMedia: Invite Link System Migration
-- 招待コード手入力型 → ユニーク招待リンクシステムへ移行
-- ============================================================

-- 1. invite_codes に click_count カラム追加
-- ============================================================
ALTER TABLE invite_codes ADD COLUMN IF NOT EXISTS click_count INTEGER NOT NULL DEFAULT 0;

-- 2. verify_invite_code() — 新旧フォーマット両対応 + click_count++
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
  -- 新フォーマット(lowercase 8文字)と旧フォーマット(XXXX-XXXX-XXXX)両方にマッチ
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

-- 3. handle_new_user() — 永続招待コード自動生成 + 旧コードを使用済みにしない
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_code_record record;
  v_new_code text;
  v_attempts int := 0;
BEGIN
  -- 招待コードから紹介者を取得（新旧フォーマット両対応）
  SELECT id, created_by INTO invite_code_record
  FROM invite_codes
  WHERE (code = upper(new.raw_user_meta_data->>'invite_code')
         OR code = lower(new.raw_user_meta_data->>'invite_code'))
  LIMIT 1;

  -- profiles 作成
  INSERT INTO profiles (
    id, display_name, email, screening_answer, invited_by
  ) VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    new.email,
    new.raw_user_meta_data->>'screening_answer',
    invite_code_record.created_by
  );

  -- 招待枠を初期化
  INSERT INTO invite_slots (user_id, initial_slots)
  VALUES (new.id, 2);

  -- 通知設定を初期化
  INSERT INTO notification_preferences (user_id)
  VALUES (new.id);

  -- 枠解放条件を初期化
  INSERT INTO slot_unlock_conditions (user_id, condition)
  VALUES
    (new.id, 'content_views_3'),
    (new.id, 'profile_completed'),
    (new.id, 'first_share'),
    (new.id, 'feedback_sent');

  -- 招待実績を記録（referrals テーブルに直接 INSERT）
  IF invite_code_record.id IS NOT NULL THEN
    INSERT INTO referrals (referrer_id, referred_id, invite_code_id, registered_at)
    VALUES (invite_code_record.created_by, new.id, invite_code_record.id, now());
  END IF;

  -- 新規ユーザー用の永続招待コード自動生成（8文字小文字英数字）
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

  RETURN new;
END;
$$;

-- 4. generate_invite_code() — 既存永続コード返却 or 新規生成
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

-- 5. link_invite_code() — 永続コード対応（OAuth 後付けリンク）
-- ============================================================
CREATE OR REPLACE FUNCTION link_invite_code(input_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record record;
  caller_id uuid := auth.uid();
BEGIN
  -- 既にリンク済みならスキップ
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = caller_id AND invited_by IS NOT NULL
  ) THEN
    RETURN jsonb_build_object('success', true, 'message', 'already_linked');
  END IF;

  -- 招待コード検証（新旧フォーマット両対応）
  SELECT ic.id, ic.created_by
  INTO invite_record
  FROM invite_codes ic
  WHERE (ic.code = upper(input_code) OR ic.code = lower(input_code))
    AND (ic.expires_at IS NULL OR ic.expires_at > now());

  IF invite_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'invalid_code');
  END IF;

  -- profiles.invited_by を更新
  UPDATE profiles
  SET invited_by = invite_record.created_by
  WHERE id = caller_id;

  -- 招待実績を記録
  INSERT INTO referrals (referrer_id, referred_id, invite_code_id, registered_at)
  VALUES (invite_record.created_by, caller_id, invite_record.id, now());

  RETURN jsonb_build_object('success', true, 'message', 'linked');
END;
$$;

GRANT EXECUTE ON FUNCTION link_invite_code(text) TO authenticated;

-- 6. admin_user_stats ビュー更新 — click_count 集計
-- ============================================================
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT
  p.id,
  p.display_name AS name,
  p.email,
  p.status,
  p.rank,
  p.role,
  p.created_at AS join_date,
  coalesce(ic.total_clicks, 0)::int AS clicks,
  coalesce(r.registration_count, 0)::int AS registrations,
  coalesce(r.registration_count, 0)::int AS referrals
FROM profiles p
LEFT JOIN LATERAL (
  SELECT sum(click_count) AS total_clicks
  FROM invite_codes
  WHERE created_by = p.id
) ic ON true
LEFT JOIN LATERAL (
  SELECT count(*) AS registration_count
  FROM referrals
  WHERE referrer_id = p.id AND referred_id IS NOT NULL
) r ON true;
