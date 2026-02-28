# TheJapanLocalMedia — 新規構築 完全手順書

> **このドキュメントについて**
> エンジニアでない方でも、この手順書を上から順番に実行すれば
> `kuchikomi-farm.com` でサービスを公開できるように書かれています。
> Claude Codeへの開発依頼プロンプトも含まれています。

---

## ⏱ 全体の作業時間の目安

| フェーズ | 内容 | 目安時間 |
|---------|------|---------|
| STEP 1 | アカウント作成 | 約2〜3時間 |
| STEP 2 | Claude Codeに開発依頼 | 約3〜5時間（AIが作業） |
| STEP 3 | Vercelで公開・動作確認 | 約1時間 |

---

## 📋 全体の流れ

```
GitHub        → コードを保存する場所を作る
Namecheap     → kuchikomi-farm.com を買う
Cloudflare    → ドメインをサービスに繋げる
Supabase      → データベース（会員情報・記事など）を作る
Clerk         → ログイン・会員登録の仕組みを作る
Resend        → サービスからメールを送れるようにする
Upstash       → アクセス速度改善・不正アクセス対策
PostHog       → 「どんなユーザーがどのページを見たか」を計測
Sentry        → エラーが起きたとき自動で通知してもらう
Vercel        → 作ったサービスをインターネットに公開する
                  ↓
          Claude Codeで開発 → 公開完了！
```

---

## 🔑 メモ帳（作業前に印刷またはメモ帳を用意してください）

作業中に出てくる「キー」や「URL」をここに書き込んでください。
**これらは絶対に他人に見せないでください（パスワードと同じです）。**

```
【GitHub】
  リポジトリURL: https://github.com/___________/japan-local-media

【Supabase】
  Project URL:          https://____________.supabase.co
  anon public キー:     eyJ_______________
  service_role キー:    eyJ_______________ ← 特に厳重に管理！

【Clerk】
  Publishable Key:      pk_live___________
  Secret Key:           sk_live___________ ← 厳重に管理！
  Webhook Secret:       whsec_____________

【Resend】
  API Key:              re________________

【Upstash Redis】
  REST URL:             https://___________
  REST Token:           ___________________

【PostHog】
  Project API Key:      phc________________
  Host URL:             https://us.posthog.com

【Sentry】
  DSN:                  https://___@___.ingest.sentry.io/___

【Vercel】
  公開URL（デプロイ後）: https://kuchikomi-farm.com
```

---

## STEP 1: アカウントを作る

> 💡 **ポイント**: 全サービスを**この順番通りに**登録してください。
> 後のサービスが前のサービスの情報を使うことがあるためです。

---

### 1-1. GitHub（コードの保管場所）
> **何のため？** 作ったプログラムを保存・管理する場所です。
> Googleドライブのプログラム版と思ってください。
> **費用:** 無料

**手順:**
1. https://github.com を開く
2. 右上の「**Sign up**」をクリック
3. メールアドレス・パスワード・ユーザー名を入力して登録
4. 届いたメールを確認してメール認証を完了
5. ログイン後、右上の「**+**」→「**New repository**」をクリック
6. 以下を入力:
   - Repository name: `japan-local-media`
   - ○ **Private**（非公開）を選択
7. 「**Create repository**」をクリック
8. 表示されたページのURL（例: `https://github.com/あなたのID/japan-local-media`）をメモ帳に記録

✅ GitHubのアカウント作成完了

---

### 1-2. Namecheap（ドメイン取得）
> **何のため？** `kuchikomi-farm.com` というURLを購入する場所です。
> このURLがないと、自分のサービスに「住所」がない状態になります。
> **費用:** 約¥1,800〜¥2,500/年（年1回払い）

**手順:**
1. https://www.namecheap.com を開く
2. 右上「**Sign Up**」をクリック
3. 名前・メール・パスワードを入力して登録 → メール認証
4. ログイン後、検索バーに `japanlocalmedia` と入力して「**Search**」
5. `kuchikomi-farm.com` が表示されたら「**Add to Cart**」をクリック
   - ⚠️ `.com` が既に取得済みの場合は `.jp` や `.net` も検討
6. カートを確認 → 「**Confirm Order**」→ 支払い情報を入力して購入
7. 購入完了後、「**Domain List**」でドメインが表示されることを確認

> 📝 メモ: 取得したドメイン名（`kuchikomi-farm.com`）を記録しておく

✅ ドメイン取得完了

---

### 1-3. Cloudflare（ドメインの繋ぎ役）
> **何のため？** 買ったドメイン（kuchikomi-farm.com）を
> 実際のサーバー（Vercel）に繋ぐための「電話帳」的な役割を担います。
> さらに、悪意のあるアクセスからサイトを守ってくれます。
> **費用:** 無料

**手順:**
1. https://www.cloudflare.com を開く
2. 右上「**Sign Up**」をクリック → メール・パスワードで登録
3. ログイン後、「**Add a Site**」をクリック
4. `kuchikomi-farm.com` と入力 → 「**Add Site**」
5. 一番下の「**Free**」プランを選択 → 「**Continue**」
6. 「**Continue**」をクリックしてスキャンを完了させる
7. 画面に**2つのネームサーバー**が表示される（例: `xxx.ns.cloudflare.com`）
   → これを📝メモする（次のステップで使う）

**Namecheapでネームサーバーを変更する:**
8. Namecheapに戻る → 「**Domain List**」→ `kuchikomi-farm.com` の「**Manage**」
9. 「**Nameservers**」のドロップダウンを「**Custom DNS**」に変更
10. CloudflareのネームサーバーをNameserver 1・2に入力 → 保存
11. Cloudflareに戻り「**Done, check nameservers**」をクリック

> ⚠️ ネームサーバーの反映に最大48時間かかることがあります（通常は数時間）

✅ Cloudflare設定完了

---

### 1-4. Supabase（データベース）
> **何のため？** 会員情報・記事・いいねなどのデータを保管するサービスです。
> 「Excelの超高機能版がインターネット上にある」というイメージです。
> **費用:** 無料（月500MBまで）

**手順:**
1. https://supabase.com を開く
2. 右上「**Start your project**」→「**Sign Up with GitHub**」でGitHubアカウントでログイン
3. 「**New Project**」をクリック
4. 以下を設定:
   - Name: `japan-local-media`
   - Database Password: 強力なパスワードを自分で設定（📝必ずメモする）
   - Region: **Northeast Asia (Tokyo)** を選択
5. 「**Create new project**」をクリック（作成に1〜2分かかります）
6. 作成完了後、左側メニューの「**Project Settings**」→「**API**」をクリック
7. 以下をメモ帳に記録:
   - **Project URL**: `https://xxxx.supabase.co` という形式のURL
   - **anon public**: `eyJ...` から始まる長い文字列
   - **service_role**: `eyJ...` から始まる別の長い文字列 ← ⚠️特に厳重に管理！

> ⚠️ **service_roleキーは絶対に他人に見せてはいけません。**
> このキーがあると全てのデータを操作できてしまいます。

✅ Supabase設定完了

---

### 1-5. Clerk（ログイン・会員登録の管理）
> **何のため？** ユーザーのログイン・ログアウト・会員登録の仕組みを提供するサービスです。
> 本来作るのに数週間かかるログイン機能を、数時間で実装できます。
> **費用:** 無料（月1万人まで）

**手順:**
1. https://clerk.com を開く
2. 「**Start Building for Free**」→ GitHubでサインイン
3. 「**Create application**」をクリック
4. 以下を設定:
   - Application name: `japan-local-media`
   - Sign-in options: 「**Email**」と「**Password**」にチェック
5. 「**Create Application**」をクリック
6. 左側メニュー「**API Keys**」をクリック
7. 以下をメモ帳に記録:
   - **Publishable key**: `pk_live_...` から始まるキー
   - **Secret keys** → 「**Show Secret Key**」をクリック → `sk_live_...` をメモ

**Webhook（自動通知）の設定:**
8. 左側メニュー「**Webhooks**」→「**Add Endpoint**」
9. URL欄には後でVercelのURLを入力するので、今は空欄のままにして次の設定へ
   （デプロイ後に戻ってきて設定します）
10. 「Signing Secret」をメモしておく（Webhook設定後に表示される）

✅ Clerk設定完了

---

### 1-6. Resend（サービスからメールを送る）
> **何のため？** 「会員登録ありがとうございます」「承認されました」などの
> メールを自動でユーザーに送るためのサービスです。
> Gmailは大量送信に向かないため、専用サービスを使います。
> **費用:** 無料（月3,000通まで）

**手順:**
1. https://resend.com を開く
2. 「**Get Started**」→ GitHubでサインイン
3. ダッシュボードが表示されたら、左メニュー「**Domains**」をクリック
4. 「**Add Domain**」→ `kuchikomi-farm.com` を入力 → 「**Add**」
5. DNSレコードが表示される → 以下の3種類のレコードをCloudflareに追加する

**Cloudflareにメール認証用レコードを追加する:**
6. Cloudflareのダッシュボードを開く → `kuchikomi-farm.com` を選択
7. 「**DNS**」→「**Add Record**」をクリック
8. Resendに表示された各レコードを1つずつ追加:
   - Type「TXT」のレコード → CloudflareでType: TXTを選択して入力
   - Type「MX」のレコード → CloudflareでType: MXを選択して入力
   - DKIM用のレコード → 同様に追加
9. Resendに戻り「**Verify Domain**」をクリック → 緑色の「Verified」が表示されればOK

**APIキーを取得:**
10. 左メニュー「**API Keys**」→「**Create API Key**」
11. Name: `japan-local-media-prod`
12. Permission: 「**Full Access**」
13. 「**Create**」をクリック
14. 表示された `re_...` というキーを📝メモする（**この画面を閉じると二度と見られません**）

✅ Resend設定完了

---

### 1-7. Upstash（高速化・不正アクセス防止）
> **何のため？** よく使うデータを一時的に高速で読み書きできる場所に置くことで
> サービスの応答速度を改善します。また「1分間に何百回もアクセスしてくる
> 不正なbot」をブロックするレート制限にも使います。
> **費用:** 無料（月1万リクエストまで）

**手順:**
1. https://upstash.com を開く
2. 「**Start for Free**」→ GitHubでサインイン
3. 「**Create Database**」をクリック
4. 以下を設定:
   - Name: `japan-local-media-cache`
   - Type: **Regional**
   - Region: **ap-northeast-1 (Tokyo)** を選択
5. 「**Create**」をクリック
6. 作成後のページで「**REST API**」タブをクリック
7. 以下をメモ帳に記録:
   - **UPSTASH_REDIS_REST_URL**: `https://...upstash.io` の形式
   - **UPSTASH_REDIS_REST_TOKEN**: 長い英数字の文字列

✅ Upstash設定完了

---

### 1-8. PostHog（ユーザー行動分析）
> **何のため？** 「どのページに何人来たか」「どのボタンが押されたか」「どこで
> 離脱したか」を可視化するサービスです。感覚ではなくデータでサービスを
> 改善できるようになります。
> **費用:** 無料（月100万イベントまで）

**手順:**
1. https://posthog.com を開く
2. 「**Get started for free**」→ メールアドレスで登録
3. Organization name: `japan-local-media` と入力
4. 「**Create Organization**」
5. Project name: `production` → 「**Create Project**」
6. 「**Web**」を選択
7. 左下の歯車アイコン「**Settings**」→「**Project settings**」
8. 「**Project API Key**」（`phc_...`）をメモ帳に記録
9. 「**Host**」は `https://us.posthog.com` をメモ

✅ PostHog設定完了

---

### 1-10. Sentry（エラー自動通知）
> **何のため？** サービスでエラーが発生したとき、ユーザーから問い合わせが
> 来る前に自動で通知してくれるサービスです。「ユーザーが困っている状況を
> 自分が最初に発見できる」ようになります。
> **費用:** 無料（月5,000エラーまで）

**手順:**
1. https://sentry.io を開く
2. 「**Try for free**」→ GitHubでサインイン
3. 組織名を入力（例: `japan-local-media`）→ 「**Create Organization**」
4. 「**Create Project**」をクリック
5. 一覧から「**Next.js**」を選択
6. Alert frequency: 「**Alert me on every new issue**」を選択
7. Project name: `japan-local-media` → 「**Create Project**」
8. 表示された「**DSN**」（`https://xxx@xxx.ingest.sentry.io/xxx`）をメモ帳に記録

✅ Sentry設定完了

---

### 1-11. Vercel（インターネットに公開）
> **何のため？** 自分のパソコンで作ったサービスをインターネット上に公開する
> サービスです。コードをアップロードするだけで世界中からアクセスできるURLが
> 自動発行されます。SSL証明書（🔒マーク）も自動です。
> **費用:** 無料（個人・小規模利用）

**手順:**
1. https://vercel.com を開く
2. 「**Sign Up**」→「**Continue with GitHub**」
3. 「**Add New Project**」→ GitHubの `japan-local-media` リポジトリを選択
4. 「**Import**」をクリック
5. **⚠️ まだ「Deploy」はクリックしない** → 次のSTEP 2でコードができてからデプロイします

**ドメインの登録（後でやる作業のための下準備）:**
6. ダッシュボードに戻り、作成したプロジェクトをクリック
7. 「**Settings**」→「**Domains**」→「**Add**」
8. `kuchikomi-farm.com` と入力 → 「**Add**」

**Cloudflareに繋ぐためのDNSレコードを設定:**
9. Vercelが「CNAME レコードを追加してください」と表示する
10. Cloudflareを開く → `kuchikomi-farm.com` → 「**DNS**」→「**Add Record**」
11. Type: `CNAME`, Name: `@`, Target: `cname.vercel-dns.com` を入力 → 「**Save**」

✅ Vercel設定完了（デプロイはSTEP 3で実施）

---

## STEP 2: Claude Codeに開発依頼する

> 💡 **このSTEPについて**
> 以下の**「Claude Codeへの依頼プロンプト」**をまるごとコピーして、
> Claude Codeのチャット画面に貼り付けてください。
> AIが自動でコードを作成します。

---

### 📌 Claude Codeへの依頼プロンプト（ここからコピー）

---

```
# TheJapanLocalMedia — 新規構築依頼

## 概要
招待制クローズドメディアプラットフォームを新規構築してください。
既存の参考実装が以下のパスにあります。UIデザイン・機能・DBスキーマを
忠実に踏襲しながら、認証をClerkに移行し、メール・キャッシュ・AI推薦・
分析・エラー監視を新スタックで実装してください。

参考コード: /Users/[あなたのMacのユーザー名]/Desktop/closed-media-ui

ドメイン: kuchikomi-farm.com

## 使用スタック
- **フレームワーク**: Next.js 15 (App Router) + React 19 + TypeScript strict
- **UI**: shadcn/ui + Tailwind CSS
- **認証**: Clerk（Supabase Authから移行）
- **データベース**: Supabase PostgreSQL（Service Role経由でServer Actionsから操作）
- **メール**: Resend + React Email
- **キャッシュ・レート制限**: Upstash Redis
- **プロダクト分析**: PostHog
- **エラー監視**: Sentry
- **ホスティング**: Vercel
- **バージョン管理**: GitHub

## 手順1: プロジェクト初期化

ターミナルで以下を実行してください:

```bash
npx create-next-app@latest japan-local-media \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd japan-local-media

npm install \
  @clerk/nextjs \
  @supabase/supabase-js \
  @upstash/redis \
  @upstash/ratelimit \
  resend \
  react-email \
  @react-email/components \
  posthog-js \
  posthog-node \
  @sentry/nextjs \
  zustand \
  zod \
  recharts \
  lucide-react \
  next-themes \
  date-fns \
  react-markdown \
  remark-gfm \
  svix

npm install -D @types/node

npx shadcn@latest init
# Style: Default / Base color: Zinc / CSS variables: Yes

npx shadcn@latest add button input label card badge avatar dialog sheet \
  tabs select textarea toast toaster alert separator skeleton progress switch
```

## 手順2: 環境変数ファイルを作成

プロジェクトルートに `.env.local` を作成して以下を記入:

```env
# ── Clerk（認証）──────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_ここに入力
CLERK_SECRET_KEY=sk_live_ここに入力
CLERK_WEBHOOK_SECRET=whsec_ここに入力（Webhook設定後に入力）
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/feed
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/signup/complete

# ── Supabase（データベース）──────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://ここに入力.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ここに入力
SUPABASE_SERVICE_ROLE_KEY=ここに入力

# ── Resend（メール送信）──────────────────────────
RESEND_API_KEY=re_ここに入力
RESEND_FROM_EMAIL=noreply@kuchikomi-farm.com

# ── Upstash Redis（キャッシュ）────────────────────
UPSTASH_REDIS_REST_URL=https://ここに入力.upstash.io
UPSTASH_REDIS_REST_TOKEN=ここに入力

# ── PostHog（分析）──────────────────────────────
NEXT_PUBLIC_POSTHOG_KEY=phc_ここに入力
NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com

# ── Sentry（エラー監視）──────────────────────────
NEXT_PUBLIC_SENTRY_DSN=https://ここに入力@ここに入力.ingest.sentry.io/ここに入力

# ── アプリ設定 ──────────────────────────────────
NEXT_PUBLIC_APP_URL=https://kuchikomi-farm.com
```

## 手順3: Supabaseのデータベースを設定

Supabaseダッシュボード（https://supabase.com）を開き、
左メニューの「**SQL Editor**」→「**New query**」で
以下のSQLを**順番に**実行してください。
「Run」ボタンをクリックすると実行できます。

### SQL 1/4: 型定義と共通関数

```sql
-- 拡張機能の有効化
create extension if not exists "pgcrypto";

-- メンバーランク（会員の等級）
create type member_rank as enum ('standard', 'gold', 'platinum', 'diamond');

-- ユーザーの役割
create type user_role as enum ('member', 'admin');

-- ユーザーのステータス
create type user_status as enum ('pending', 'active', 'suspended');

-- コンテンツの種類
create type content_type as enum ('article', 'video', 'external');

-- コンテンツの公開状態
create type content_status as enum ('draft', 'scheduled', 'published');

-- インタラクションの種類
create type interaction_type as enum ('view', 'like', 'bookmark');

-- アンロック条件の種類
create type unlock_condition_type as enum (
  'content_views_3',
  'profile_completed',
  'first_share',
  'feedback_sent'
);

-- updated_at を自動更新する共通関数
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```

### SQL 2/4: プロフィール・招待テーブル

```sql
-- ユーザープロフィール（Clerk連携: profiles.id = ClerkのユーザーID）
create table profiles (
  id                text primary key,        -- Clerkが発行するユーザーID
  member_id         text unique not null,    -- JK-00001 形式の会員ID
  display_name      text not null,
  email             text not null unique,
  phone             text,
  bio               text,
  location          text,
  company           text,
  position          text,
  avatar_url        text,
  rank              member_rank not null default 'standard',
  role              user_role not null default 'member',
  status            user_status not null default 'pending',
  screening_answer  text,
  invited_by        text references profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 会員IDを自動採番（JK-00001, JK-00002, ...）
create or replace function generate_member_id()
returns trigger as $$
begin
  new.member_id := 'JK-' || lpad(
    (select coalesce(max(substring(member_id from 4)::int), 0) + 1
     from profiles)::text,
    5, '0'
  );
  return new;
end;
$$ language plpgsql;

create trigger trg_member_id
  before insert on profiles
  for each row execute function generate_member_id();

create trigger trg_profiles_updated
  before update on profiles
  for each row execute function update_updated_at();

-- 招待コード
create table invite_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  created_by  text not null references profiles(id),
  is_used     boolean not null default false,
  click_count int not null default 0,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index idx_invite_codes_code on invite_codes(code);

-- 紹介トラッキング
create table referrals (
  id              uuid primary key default gen_random_uuid(),
  referrer_id     text not null references profiles(id),
  referred_id     text references profiles(id),
  invite_code_id  uuid references invite_codes(id),
  clicked_at      timestamptz not null default now(),
  registered_at   timestamptz
);
create index idx_referrals_referrer on referrals(referrer_id);

-- 招待スロット（各ユーザーが持てる招待枠数）
create table invite_slots (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null references profiles(id) on delete cascade,
  initial_slots int not null default 2,
  bonus_slots   int not null default 0,
  used_slots    int not null default 0,
  updated_at    timestamptz not null default now(),
  unique(user_id)
);

-- アンロック条件（ボーナス招待枠獲得条件の進捗）
create table slot_unlock_conditions (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null references profiles(id) on delete cascade,
  condition     unlock_condition_type not null,
  completed     boolean not null default false,
  completed_at  timestamptz,
  unique(user_id, condition)
);
```

### SQL 3/4: コンテンツ・報酬テーブル

```sql
-- コンテンツ（記事・動画・外部リンク）
create table contents (
  id               uuid primary key default gen_random_uuid(),
  type             content_type not null,
  title            text not null,
  description      text,
  body             text,
  status           content_status not null default 'draft',
  publish_date     timestamptz,
  author_id        text references profiles(id),
  author_name      text not null,
  author_bio       text,
  thumbnail_url    text,
  url              text,
  duration         text,
  views            int not null default 0,
  likes            int not null default 0,
  premium          boolean not null default false,
  required_rank    member_rank not null default 'standard',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger trg_contents_updated
  before update on contents
  for each row execute function update_updated_at();

create index idx_contents_status on contents(status);
create index idx_contents_publish_date on contents(publish_date desc);

-- タグ
create table tags (
  id    uuid primary key default gen_random_uuid(),
  name  text unique not null
);

create table content_tags (
  content_id  uuid not null references contents(id) on delete cascade,
  tag_id      uuid not null references tags(id) on delete cascade,
  primary key (content_id, tag_id)
);

-- ユーザーのコンテンツ操作（いいね・ブックマーク・閲覧）
create table content_interactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null references profiles(id) on delete cascade,
  content_id  uuid not null references contents(id) on delete cascade,
  type        interaction_type not null,
  created_at  timestamptz not null default now(),
  unique(user_id, content_id, type)
);
create index idx_interactions_content on content_interactions(content_id, type);

-- 報酬ティア
create table rewards (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text not null,
  required_referrals  int not null,
  icon                text not null default 'Gift',
  status              text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at          timestamptz not null default now()
);

-- 報酬申請
create table reward_claims (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null references profiles(id) on delete cascade,
  reward_id   uuid not null references rewards(id) on delete cascade,
  status      text not null default 'pending'
    check (status in ('pending', 'granted', 'rejected')),
  claimed_at  timestamptz not null default now(),
  granted_at  timestamptz,
  unique(user_id, reward_id)
);

-- ブロードキャスト通知
create table broadcasts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  target_rank text not null default 'all',
  status      text not null default 'sent'
    check (status in ('sent', 'failed', 'scheduled')),
  sent_at     timestamptz not null default now(),
  created_by  text references profiles(id)
);

-- 通知設定
create table notification_preferences (
  user_id               text primary key references profiles(id) on delete cascade,
  email_new_content     boolean not null default true,
  email_newsletter      boolean not null default true,
  email_invite_update   boolean not null default true,
  push_browser          boolean not null default false,
  updated_at            timestamptz not null default now()
);

-- ログイン履歴
create table login_history (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null references profiles(id) on delete cascade,
  device        text,
  ip_address    text,
  logged_in_at  timestamptz not null default now()
);
create index idx_login_history_user on login_history(user_id, logged_in_at desc);
```

### SQL 4/4: RLSポリシーと初期データ

```sql
-- 全テーブルのRow Level Security（行レベルセキュリティ）を有効化
alter table profiles enable row level security;
alter table invite_codes enable row level security;
alter table invite_slots enable row level security;
alter table slot_unlock_conditions enable row level security;
alter table referrals enable row level security;
alter table contents enable row level security;
alter table tags enable row level security;
alter table content_tags enable row level security;
alter table content_interactions enable row level security;
alter table rewards enable row level security;
alter table reward_claims enable row level security;
alter table broadcasts enable row level security;
alter table notification_preferences enable row level security;
alter table login_history enable row level security;

-- ※ 全てのDB操作はサーバーサイドのService Roleで行うため
-- RLSはクライアント側の安全弁として有効化のみ行う。

-- 初期報酬データ
insert into rewards (title, description, required_referrals, icon, status) values
  (
    '非公開プレミアムコンテンツ（¥10万相当）',
    '10名紹介達成者限定の非公開プレミアムコンテンツへのアクセス権',
    10, 'FileText', 'active'
  ),
  (
    '¥100万円プレミアムサロン参加権',
    '100名紹介達成者のみが参加できる限定サロンへの招待',
    100, 'Users', 'active'
  ),
  (
    '主催者・トップ人材との1on1',
    '1000名紹介達成の証として、主催者または各界トップ人材との特別対談',
    1000, 'Crown', 'active'
  );
```

## 手順4: アプリケーションのファイル構成

以下の構成でファイルを作成してください。
既存の `closed-media-ui` のUIデザインを**そのまま流用**しながら、
認証部分をClerkに置き換えてください。

```
src/
├── app/
│   ├── layout.tsx              # ClerkProvider + PostHog + Sentry を設定
│   ├── middleware.ts            # Clerk認証ガード（未ログインをリダイレクト）
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx   # Clerkサインインページ
│   │   └── sign-up/[[...sign-up]]/page.tsx   # Clerkサインアップページ
│   ├── signup/
│   │   └── complete/page.tsx   # スクリーニング質問（入会理由）
│   ├── feed/page.tsx           # コンテンツフィード（参考: closed-media-ui/app/feed）
│   ├── article/[id]/page.tsx   # 記事詳細（参考: closed-media-ui/app/article）
│   ├── mypage/page.tsx         # マイページ（参考: closed-media-ui/app/mypage）
│   ├── favorites/page.tsx      # お気に入り
│   ├── settings/page.tsx       # 設定（参考: closed-media-ui/app/settings）
│   ├── admin/page.tsx          # 管理者ダッシュボード（参考: closed-media-ui/app/admin）
│   └── api/
│       └── webhooks/
│           └── clerk/route.ts  # Clerk Webhook（ユーザー作成時にSupabaseにプロフィール作成）
├── actions/
│   ├── auth.ts                 # 招待コード検証・プロフィール操作
│   ├── content.ts              # コンテンツCRUD
│   ├── profile.ts              # プロフィール更新・招待コード生成
│   ├── interactions.ts         # いいね・ブックマーク・閲覧
│   └── admin.ts                # 管理者操作（ユーザー承認等）
├── lib/
│   ├── supabase.ts             # Supabaseクライアント（adminキー使用）
│   ├── redis.ts                # Upstash Redisクライアント + レート制限
│   ├── posthog.ts              # PostHog分析クライアント
│   ├── email/
│   │   ├── index.ts            # Resend送信ラッパー
│   │   └── templates/
│   │       ├── welcome.tsx     # 登録ありがとうメール（React Email）
│   │       ├── approval.tsx    # 承認完了メール
│   │       └── invite.tsx      # 招待メール
│   └── types.ts                # 型定義（closed-media-ui/lib/types.ts を流用）
└── components/
    ├── ui/                     # shadcn/uiコンポーネント（自動生成）
    ├── admin/                  # 管理画面（closed-media-ui/components/admin/ を流用）
    ├── content/                # コンテンツ表示コンポーネント
    └── layout/                 # ヘッダー・ナビゲーション
```

## 手順5: middleware.ts（認証ガード）

```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// 認証不要の公開ページ
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

## 手順6: lib/supabase.ts（データベースクライアント）

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// サーバーサイド専用（Service Role = 管理者権限）
// ⚠️ このクライアントはServer Actions内でのみ使用すること
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

## 手順7: lib/redis.ts（キャッシュ・レート制限）

```typescript
// src/lib/redis.ts
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// 招待コード検証: 同じIPから1分間に10回まで
export const inviteCodeRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'invite_code',
})

// ログイン試行: 同じIPから1分間に5回まで
export const loginRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'login',
})
```

## 手順8: api/webhooks/clerk/route.ts（Clerk Webhook）

Clerkでユーザーが登録されたとき、自動的にSupabaseにプロフィールを作成する処理:

```typescript
// src/app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!
  const headerPayload = headers()
  const body = await req.text()

  // Webhookの署名を検証（なりすまし対策）
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent
  try {
    evt = wh.verify(body, {
      'svix-id': headerPayload.get('svix-id')!,
      'svix-timestamp': headerPayload.get('svix-timestamp')!,
      'svix-signature': headerPayload.get('svix-signature')!,
    }) as WebhookEvent
  } catch {
    return new Response('Invalid webhook signature', { status: 400 })
  }

  // 新規ユーザー登録時の処理
  if (evt.type === 'user.created') {
    const {
      id,
      email_addresses,
      first_name,
      last_name,
      image_url,
      unsafe_metadata,
    } = evt.data

    const email = email_addresses[0]?.email_address!
    const displayName =
      [first_name, last_name].filter(Boolean).join(' ') ||
      email.split('@')[0] ||
      'ユーザー'

    // 招待コード（サインアップフォームから受け取る）
    const inviteCode = (unsafe_metadata as Record<string, unknown>)
      ?.invite_code as string | undefined

    // 招待者を特定
    let invitedBy: string | null = null
    let inviteCodeId: string | null = null

    if (inviteCode) {
      const { data: codeData } = await supabaseAdmin
        .from('invite_codes')
        .select('id, created_by')
        .eq('code', inviteCode)
        .single()

      if (codeData) {
        invitedBy = codeData.created_by
        inviteCodeId = codeData.id
      }
    }

    // Supabaseにプロフィールを作成
    const { error } = await supabaseAdmin.from('profiles').insert({
      id,
      display_name: displayName,
      email,
      avatar_url: image_url,
      invited_by: invitedBy,
      status: 'pending',   // 管理者の承認待ち
      role: 'member',
      rank: 'standard',
    })

    if (error) {
      console.error('Profile creation failed:', error)
      return new Response('Profile creation failed', { status: 500 })
    }

    // 招待スロット・アンロック条件・通知設定を初期化
    await Promise.all([
      supabaseAdmin
        .from('invite_slots')
        .insert({ user_id: id }),

      supabaseAdmin
        .from('slot_unlock_conditions')
        .insert([
          { user_id: id, condition: 'content_views_3' },
          { user_id: id, condition: 'profile_completed' },
          { user_id: id, condition: 'first_share' },
          { user_id: id, condition: 'feedback_sent' },
        ]),

      supabaseAdmin
        .from('notification_preferences')
        .insert({ user_id: id }),
    ])

    // 紹介トラッキング
    if (invitedBy && inviteCodeId) {
      await supabaseAdmin.from('referrals').insert({
        referrer_id: invitedBy,
        referred_id: id,
        invite_code_id: inviteCodeId,
        registered_at: new Date().toISOString(),
      })
    }

    // ウェルカムメール送信
    await sendWelcomeEmail({ email, displayName })
  }

  // ユーザー削除時の処理
  if (evt.type === 'user.deleted') {
    if (evt.data.id) {
      await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', evt.data.id)
    }
  }

  return new Response('OK', { status: 200 })
}
```

## 手順9: lib/email/templates/welcome.tsx（React Email）

```typescript
// src/lib/email/templates/welcome.tsx
import {
  Html, Body, Container, Text, Heading, Hr
} from '@react-email/components'

interface WelcomeEmailProps {
  displayName: string
}

export function WelcomeEmail({ displayName }: WelcomeEmailProps) {
  return (
    <Html lang="ja">
      <Body style={{
        fontFamily: '"Noto Sans JP", sans-serif',
        backgroundColor: '#f8f9fa',
        margin: 0,
        padding: 0,
      }}>
        <Container style={{
          maxWidth: '600px',
          margin: '40px auto',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '40px',
        }}>
          <Heading style={{ color: '#1B3022', marginTop: 0 }}>
            TheJapanLocalMediaへようこそ
          </Heading>
          <Text>
            {displayName}さん、ご登録ありがとうございます。
          </Text>
          <Text>
            現在、運営チームが入会審査を行っています。
            審査完了後、このメールアドレスにご連絡いたします。
            通常1〜3営業日以内にお返事いたします。
          </Text>
          <Hr style={{ borderColor: '#D4AF37' }} />
          <Text style={{ color: '#666', fontSize: '14px' }}>
            TheJapanLocalMedia 運営チーム
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

## 手順10: lib/email/templates/approval.tsx（承認完了メール）

```typescript
// src/lib/email/templates/approval.tsx
import {
  Html, Body, Container, Text, Heading, Button, Hr
} from '@react-email/components'

interface ApprovalEmailProps {
  displayName: string
}

export function ApprovalEmail({ displayName }: ApprovalEmailProps) {
  return (
    <Html lang="ja">
      <Body style={{
        fontFamily: '"Noto Sans JP", sans-serif',
        backgroundColor: '#f8f9fa',
        margin: 0,
        padding: 0,
      }}>
        <Container style={{
          maxWidth: '600px',
          margin: '40px auto',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '40px',
        }}>
          <Heading style={{ color: '#1B3022', marginTop: 0 }}>
            入会が承認されました 🎉
          </Heading>
          <Text>
            {displayName}さん、入会審査が完了しました。
            TheJapanLocalMediaへようこそ！
          </Text>
          <Button
            href="https://kuchikomi-farm.com/feed"
            style={{
              backgroundColor: '#1B3022',
              color: '#D4AF37',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              display: 'inline-block',
              fontWeight: 'bold',
            }}
          >
            コンテンツを見る →
          </Button>
          <Hr style={{ borderColor: '#D4AF37', marginTop: '32px' }} />
          <Text style={{ color: '#666', fontSize: '14px' }}>
            TheJapanLocalMedia 運営チーム
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

## 手順11: lib/email/index.ts（メール送信ラッパー）

```typescript
// src/lib/email/index.ts
import { Resend } from 'resend'
import { render } from '@react-email/components'
import { WelcomeEmail } from './templates/welcome'
import { ApprovalEmail } from './templates/approval'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.RESEND_FROM_EMAIL!

export async function sendWelcomeEmail({
  email,
  displayName,
}: {
  email: string
  displayName: string
}) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: '【TheJapanLocalMedia】ご登録ありがとうございます',
    html: render(WelcomeEmail({ displayName })),
  })
}

export async function sendApprovalEmail({
  email,
  displayName,
}: {
  email: string
  displayName: string
}) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: '【TheJapanLocalMedia】入会が承認されました',
    html: render(ApprovalEmail({ displayName })),
  })
}
```

## 手順12: app/layout.tsx（グローバルレイアウト）

```typescript
// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { Noto_Sans_JP, Noto_Serif_JP } from 'next/font/google'
import { PostHogProvider } from '@/components/posthog-provider'
import './globals.css'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans',
})

const notoSerifJP = Noto_Serif_JP({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-serif',
})

export const metadata = {
  title: 'TheJapanLocalMedia',
  description: '地域創生・観光の最前線を届ける招待制メディア',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="ja" className={`${notoSansJP.variable} ${notoSerifJP.variable}`}>
        <body>
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

## 手順14: components/posthog-provider.tsx（分析設定）

```typescript
// src/components/posthog-provider.tsx
'use client'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
```

## 手順15: Sentryの設定

```bash
npx @sentry/wizard@latest -i nextjs
```

ウィザードが起動したら:
- 「Do you want to log in to Sentry?」→ Y
- ブラウザで承認
- 「Which project?」→ `japan-local-media` を選択
- 「Do you want to add code examples?」→ Y

自動で `sentry.client.config.ts`・`sentry.server.config.ts` が作成されます。

## 手順16: actions/auth.ts（招待コード検証）

```typescript
// src/actions/auth.ts
'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { inviteCodeRatelimit } from '@/lib/redis'
import { headers } from 'next/headers'

// 招待コードを検証してコード情報を返す
export async function verifyInviteCode(code: string) {
  // IPアドレスでレート制限（1分間に10回まで）
  const ip = headers().get('x-forwarded-for') ?? 'unknown'
  const { success } = await inviteCodeRatelimit.limit(ip)

  if (!success) {
    return { error: '試行回数が上限に達しました。しばらくしてからお試しください。' }
  }

  if (!code || code.length < 6) {
    return { error: '招待コードが短すぎます。' }
  }

  const { data, error } = await supabaseAdmin
    .from('invite_codes')
    .select('id, code, created_by, profiles!created_by(display_name)')
    .eq('code', code.toLowerCase())
    .single()

  if (error || !data) {
    return { error: '招待コードが見つかりません。' }
  }

  // クリック数をインクリメント
  await supabaseAdmin
    .from('invite_codes')
    .update({ click_count: supabaseAdmin.rpc('increment', { x: 1 }) })
    .eq('id', data.id)

  const referrerName = (data.profiles as { display_name: string })?.display_name

  return {
    success: true,
    referrerName,
    codeId: data.id,
  }
}

// ユーザーのステータスを取得（ログイン時のチェック用）
export async function getUserStatus(userId: string) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('status, role, rank')
    .eq('id', userId)
    .single()

  return data
}
```

## 手順17: actions/admin.ts（管理者操作 + 承認メール送信）

```typescript
// src/actions/admin.ts
'use server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendApprovalEmail } from '@/lib/email'
import { revalidatePath } from 'next/cache'

// 管理者権限チェック
async function requireAdmin() {
  const { userId } = auth()
  if (!userId) throw new Error('Unauthorized')

  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (data?.role !== 'admin') throw new Error('Admin required')
  return userId
}

// ユーザーを承認する（pending → active）
export async function approveUser(targetUserId: string) {
  await requireAdmin()

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email, display_name')
    .eq('id', targetUserId)
    .single()

  await supabaseAdmin
    .from('profiles')
    .update({ status: 'active' })
    .eq('id', targetUserId)

  // 承認完了メールを送信
  if (profile) {
    await sendApprovalEmail({
      email: profile.email,
      displayName: profile.display_name,
    })
  }

  revalidatePath('/admin')
}

// ユーザーを停止する
export async function suspendUser(targetUserId: string) {
  await requireAdmin()
  await supabaseAdmin
    .from('profiles')
    .update({ status: 'suspended' })
    .eq('id', targetUserId)
  revalidatePath('/admin')
}

// 会員ランクを変更する（支払い確認後に管理者が手動で変更）
export async function updateUserRank(
  targetUserId: string,
  rank: 'standard' | 'gold' | 'platinum' | 'diamond'
) {
  await requireAdmin()
  await supabaseAdmin
    .from('profiles')
    .update({ rank })
    .eq('id', targetUserId)
  revalidatePath('/admin')
}
```

## 手順18: ページ実装（既存コードを流用）

以下のページは `closed-media-ui` の対応ファイルを参考に実装してください。
**認証部分（useUserStore / Supabase Auth関連）をClerkのhooksに置き換えることが主な変更点です。**

| 新ファイル | 参考ファイル | 主な変更点 |
|-----------|------------|----------|
| `app/(auth)/sign-in/page.tsx` | `app/page.tsx` | `<SignIn />` コンポーネントに置換 |
| `app/signup/complete/page.tsx` | `app/signup/complete/page.tsx` | `useUser()` で認証情報取得 |
| `app/feed/page.tsx` | `app/feed/page.tsx` | `useAuth()` → `useUser()` |
| `app/article/[id]/page.tsx` | `app/article/[id]/page.tsx` | Clerk hooks使用 |
| `app/mypage/page.tsx` | `app/mypage/page.tsx` | Clerk hooks使用 |
| `app/settings/page.tsx` | `app/settings/page.tsx` | Clerk hooks使用 |
| `app/admin/page.tsx` | `app/admin/page.tsx` | Clerk hooks使用 |
| `app/favorites/page.tsx` | `app/favorites/page.tsx` | Clerk hooks使用 |

**Clerk hooksの使い方（参考）:**
```typescript
import { useUser, useAuth } from '@clerk/nextjs'

// ユーザー情報を取得
const { user, isLoaded } = useUser()

// Server Actionsで userId を取得
import { auth } from '@clerk/nextjs/server'
const { userId } = auth()
```

## 手順19: カラースキームとフォント（globals.css）

```css
/* src/app/globals.css に追加 */
:root {
  --color-dark-green: #1B3022;
  --color-gold: #D4AF37;
  --color-light: #F8F9FA;
  --font-sans: var(--font-noto-sans), sans-serif;
  --font-serif: var(--font-noto-serif), serif;
}
```

## 手順20: vercel.json の作成

```json
{
  "framework": "nextjs",
  "regions": ["nrt1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

## 最終確認チェックリスト

実装完了後、以下を上から順番に確認してください:

**認証フロー:**
- [ ] `/sign-in` でClerkのログインフォームが表示される
- [ ] `/sign-up` で招待コード入力 → Clerkの登録フォームが表示される
- [ ] 登録後、Webhook経由でSupabaseに profiles レコードが作成される
- [ ] 登録者にウェルカムメール（Resend）が届く
- [ ] `/admin` で承認ボタンを押すと status が `active` になる
- [ ] 承認後、承認完了メールが届く
- [ ] 未承認（pending）ユーザーはフィードにアクセスできない

**コンテンツフロー:**
- [ ] `/feed` でコンテンツ一覧が表示される
- [ ] いいね・ブックマークが動作する
- [ ] `/article/[id]` で記事詳細が表示される
- [ ] 管理者がコンテンツを作成・編集・削除できる

**その他:**
- [ ] `/mypage` で招待リンクが表示される
- [ ] PostHogにページビューが記録される
- [ ] Sentryのダッシュボードにエラーが表示される（テスト用エラーで確認）
- [ ] `kuchikomi-farm.com` でHTTPS接続できる

## 実装時の重要注意事項

1. **認証はClerkのみ**: Supabase Authは一切使わない。
   全ての認証判定は `auth()` または `useUser()` で行う。

2. **DB操作はService Role経由のみ**: Server Actions内で
   `supabaseAdmin`（service_roleキー）を使い、クライアントサイドには
   service_roleキーを渡さない。

3. **会員ランクの変更は手動**: Stripeは使用しない。
   管理者ダッシュボードから `updateUserRank()` を呼ぶ。
   Gold/Platinum/Diamondへのランクアップは管理者が手動で行う。

4. **招待コードのレート制限**: `inviteCodeRatelimit` を必ず使う。
   使わないとbotによる総当たり攻撃を受ける可能性がある。

5. **SSRとCSRの切り替え**: 全クライアントコンポーネントで mounted パターンを使う:
   ```typescript
   const [mounted, setMounted] = useState(false)
   useEffect(() => setMounted(true), [])
   if (!mounted) return null
   ```

7. **管理者の設定**: 最初の管理者はSupabase SQL Editorで手動設定:
   ```sql
   -- Clerkダッシュボードで自分のユーザーIDを確認してから実行
   update profiles set role = 'admin', status = 'active'
   where email = 'あなたのメールアドレス@example.com';
   ```

## 参考にすべき既存コードのパス

- 全ページのUIデザイン: `closed-media-ui/app/`
- 管理画面コンポーネント: `closed-media-ui/components/admin/`
- 型定義: `closed-media-ui/lib/types.ts`（そのまま流用可）
- Server Actionsパターン: `closed-media-ui/app/actions/`
- DBスキーマ（参考）: `closed-media-ui/supabase/migrations/`
```

---

## STEP 3: Vercelでデプロイ・公開する

> STEP 2のClaude Codeによる開発が完了したら実施します。

### 3-1. Vercelに環境変数を設定する

1. Vercelダッシュボード（https://vercel.com）を開く
2. 作成したプロジェクトをクリック
3. 「**Settings**」→「**Environment Variables**」をクリック
4. STEP 1の📝メモ帳を見ながら、`.env.local` の全変数を入力する
   - 「Key」欄に変数名（例: `NEXT_PUBLIC_SUPABASE_URL`）
   - 「Value」欄に値
   - 「**Add**」をクリック
   - これをすべての変数に繰り返す

### 3-2. GitHubにコードをアップロードしてデプロイする

Claude Codeが作業したフォルダで以下を実行:
```bash
git add .
git commit -m "初回デプロイ"
git push origin main
```

GitHubにプッシュされると、Vercelが自動でビルド＆公開します（3〜5分）。

### 3-3. Clerk WebhookのURLを設定する

1. Vercelダッシュボードで公開URLを確認（例: `https://kuchikomi-farm.com`）
2. Clerkダッシュボード → 「**Webhooks**」→ 「**Add Endpoint**」
3. URL: `https://kuchikomi-farm.com/api/webhooks/clerk`
4. Events:
   - ☑️ `user.created`
   - ☑️ `user.updated`
   - ☑️ `user.deleted`
5. 「**Create**」→「**Signing Secret**」をコピー
6. Vercelの環境変数 `CLERK_WEBHOOK_SECRET` に設定
7. Vercel → 「**Deployments**」→「**Redeploy**」

### 3-4. 管理者アカウントを設定する

1. `https://kuchikomi-farm.com/sign-up` にアクセス
2. 自分のメールアドレスで会員登録
3. Supabaseダッシュボード → 「**SQL Editor**」で以下を実行:
```sql
update profiles
set role = 'admin', status = 'active'
where email = 'あなたのメールアドレス@example.com';
```

4. `https://kuchikomi-farm.com/admin` にアクセスして管理画面が開けばOK

### 3-5. 動作確認チェックリスト

- [ ] `https://kuchikomi-farm.com` が表示される
- [ ] サインアップ → ウェルカムメールが届く
- [ ] 管理画面で承認 → 承認完了メールが届く
- [ ] フィードページでコンテンツが表示される
- [ ] 管理画面でコンテンツを追加できる

✅ **公開完了！**

---

## 💰 月間コスト試算

| サービス | 月額 | 備考 |
|---------|------|------|
| **Claude** | ¥3,000 | AI開発補助（唯一の固定費）|
| **Namecheap** | ¥150 | ドメイン年払い（¥1,800÷12ヶ月）|
| **Supabase** | ¥0 | 無料（月500MB・500MB以上はPro ¥3,400/月）|
| **Clerk** | ¥0 | 無料（月1万ユーザーまで）|
| **Vercel** | ¥0 | 無料（個人利用）|
| **Cloudflare** | ¥0 | 無料 |
| **Resend** | ¥0 | 無料（月3,000通まで）|
| **Upstash** | ¥0 | 無料（月1万リクエストまで）|
| **PostHog** | ¥0 | 無料（月100万イベントまで）|
| **Sentry** | ¥0 | 無料（月5,000エラーまで）|
| 🏁 **合計** | **¥3,150/月** | 初期フェーズは実質Claude代のみ |

---

## 🆘 困ったときのQ&A

**Q: Supabaseにデータが保存されない**
A: Clerk WebhookのURLが正しく設定されているか確認してください。
   Clerkダッシュボード → Webhooks → ログを確認するとエラー内容がわかります。

**Q: メールが届かない**
A: Resendのドメイン認証が完了しているか確認してください（緑色のVerified表示）。
   Resendダッシュボード → Logs でエラーを確認できます。

**Q: `kuchikomi-farm.com` にアクセスできない**
A: CloudflareのネームサーバーがNamecheapに反映されるまで最大48時間かかります。
   https://dnschecker.org で `kuchikomi-farm.com` を検索して確認してください。

**Q: 管理画面に入れない（403エラー）**
A: Supabaseで `profiles.role = 'admin'` に設定したか確認してください。
   SQL Editorで `select * from profiles where email = 'あなたのメール';` を実行して確認。

**Q: ビルドエラーでデプロイできない**
A: Vercel → Deployments → 失敗したデプロイをクリック → Build Logs を確認してください。
   エラーメッセージをClaude Codeに貼り付けると解決策を教えてもらえます。

---

## 📚 用語集（わからない言葉が出たら見てください）

| 用語 | 意味 |
|-----|------|
| **ドメイン** | サービスの住所。`kuchikomi-farm.com` のこと |
| **DNS** | ドメイン名をサーバーのIPアドレスに変換する仕組み（電話帳のようなもの）|
| **データベース** | データを保存・整理する場所。Excelの超高機能版 |
| **API** | プログラム同士が会話するための窓口 |
| **APIキー** | APIを使うための合言葉（パスワードのようなもの）|
| **Webhook** | 「○○が起きたら自動で通知して」という仕組み |
| **デプロイ** | 作ったサービスをインターネットに公開する作業 |
| **環境変数** | プログラムに渡す設定値（APIキーなど）を安全に保管する仕組み |
| **SSL証明書** | URLが `https://` になるセキュリティの仕組み（🔒マーク）|
| **レート制限** | 「1分間に○回まで」とアクセスを制限して攻撃を防ぐ仕組み |
| **ベクター** | AIが「意味の近さ」を計算するための数値の配列 |
| **RLS** | データベースの行単位のアクセス制御（Row Level Security）|
| **Server Actions** | サーバー側で実行されるNext.jsの関数（DBへの安全なアクセスに使う）|
