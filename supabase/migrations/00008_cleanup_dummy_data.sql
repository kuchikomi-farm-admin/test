-- 00008_cleanup_dummy_data.sql
-- ダミーデータの完全クリーンアップ
-- 注意: 管理者アカウント（role = 'admin'）は保持されます

-- 依存関係の順序でデータ削除

-- コンテンツ関連
delete from content_interactions;
delete from content_tags;
delete from contents;

-- 特典・配信関連
delete from reward_claims;
delete from rewards;
delete from broadcasts;

-- 招待・紹介関連（管理者以外）
delete from referrals
  where referrer_id not in (select id from profiles where role = 'admin');

delete from invite_codes
  where created_by not in (select id from profiles where role = 'admin');

-- 招待枠（管理者以外のユーザー分をリセット）
delete from invite_slots
  where user_id not in (select id from profiles where role = 'admin');

delete from slot_unlock_conditions
  where user_id not in (select id from profiles where role = 'admin');

-- 一般ユーザープロフィール削除（管理者は保持）
-- 注意: auth.users からの削除は Supabase Dashboard 経由で行ってください
delete from profiles where role != 'admin';
