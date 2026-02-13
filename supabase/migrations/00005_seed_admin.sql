-- ============================================================
-- TheJapanLocalMedia: Seed Data (初期管理者 & サンプルコンテンツ)
-- ============================================================
-- 注意: このファイルは Supabase Dashboard の SQL Editor から手動実行してください。
-- auth.users の作成は Supabase Dashboard > Authentication で行い、
-- その後このスクリプトで profiles を admin に昇格させます。

-- 管理者アカウントの昇格 (メールアドレスで指定)
-- 事前に Supabase Dashboard > Authentication でユーザーを作成し、
-- そのメールアドレスを以下に置き換えてください。
--
-- update profiles
-- set role = 'admin', status = 'active'
-- where email = 'admin@example.com';

-- 招待特典データ
insert into rewards (title, required_referrals, description, icon, status) values
  ('有料コンテンツ解放（1万円相当）', 10, '10名の招待完了で、通常1万円相当の有料コンテンツを無料で閲覧できます。', 'Video', 'active'),
  ('限定サロン招待（10万円相当）', 100, '100名の招待完了で、10万円相当のエグゼクティブサロンへご招待します。', 'Users', 'active'),
  ('経営者との1on1セッション（1時間）', 1000, '1,000名の招待完了で、経営者との1時間のプライベート1on1セッションを提供します。', 'Crown', 'active');
