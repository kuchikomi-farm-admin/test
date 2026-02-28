# CloseMedia — SaaS型クローズドコミュニティプラットフォーム
## 新規構築プロンプト（Claude Code用）

> このドキュメントはClaude Codeへの開発依頼プロンプトです。
> 既存の `closed-media-ui`（TheJapanLocalMedia）を**参考実装**として、
> 汎用SaaSプロダクトとして再設計・新規構築します。

---

## ■ コンセプト：どんなSaaSか

**CloseMedia** — 招待制クローズドコミュニティを誰でも作れるSaaSプラットフォーム

| 役割 | 説明 |
|------|------|
| **スーパー管理者** | CloseMedia運営（あなた）。全テナントを管理 |
| **テナントオーナー** | コミュニティ主催者。Stripeで月額課金して場を作る |
| **テナント管理者** | オーナーが任命した副管理者 |
| **会員** | 招待コードで入会した一般メンバー |

**ユースケース例:**
- 地域創生メディア（現在のTheJapanLocalMedia）
- プロフェッショナル向け学習コミュニティ
- ファンクラブ・サポーター限定情報サイト
- 社内ナレッジベース（イントラネット）

**収益モデル:**
- テナントオーナーへのSaaSサブスク課金（月額¥5,000〜¥50,000）
- テナント内の会員向けサブスク課金はオーナーが自由設定（Stripeで分配）

---

## ■ PHASE 0: アカウント作成（開発前に必ず完了すること）

以下のサービスを**この順番で**登録してください。

### 0-1. GitHub
1. https://github.com → "Sign up"
2. ユーザー名・メール・パスワードを設定 → メール認証
3. 新規リポジトリ作成: `close-media`（Private推奨）
4. ローカルで `git init && git remote add origin <URL>`

### 0-2. Namecheap（ドメイン取得）
1. https://www.namecheap.com → "Sign Up"
2. ドメイン検索（例: `closemedia.io` / `closemedia.jp`）
3. カートに追加してチェックアウト（年約$15〜$30）
4. **取得したドメイン名をメモ**（以降`<YOUR_DOMAIN>`と表記）

> SaaS設計のポイント: `tenant-slug.<YOUR_DOMAIN>` のサブドメイン方式を採用。
> テナントごとに `community1.closemedia.io` のようなURLが自動発行される。

### 0-3. Cloudflare（DNS + ワイルドカードサブドメイン管理）
1. https://www.cloudflare.com → "Sign Up"
2. "Add a Site" → `<YOUR_DOMAIN>` を入力 → Free プランを選択
3. 表示されたネームサーバー2件をメモ
4. Namecheap → Domain List → Manage → Nameservers → "Custom DNS" に変更して設定
5. Cloudflare DNS → "Add Record":
   - Type: `A`, Name: `@`, Value: `76.76.21.21`（Vercel IP）
   - Type: `CNAME`, Name: `*`, Value: `cname.vercel-dns.com`（ワイルドカード）
6. SSL/TLS → Full (strict) に設定

### 0-4. Supabase（マルチテナント対応データベース）
1. https://supabase.com → GitHubでサインイン
2. "New Project" → 名前: `close-media`, リージョン: Northeast Asia (Tokyo)
3. データベースパスワードをメモ（後から変更不可）
4. Project Settings → API から以下をメモ:
   - `Project URL`
   - `anon public` キー
   - `service_role` キー（**絶対に公開しないこと**）

### 0-5. Clerk（マルチテナント対応認証）
1. https://clerk.com → GitHubでサインイン
2. "Create application" → 名前: `close-media`
3. サインイン方法: "Email" + "Password" + "Google"（SSO追加推奨）
4. Dashboard → **Organizations** を有効化（テナント管理に使用）
5. API Keys から以下をメモ:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
6. Webhooks → "Add Endpoint":
   - Events: `user.created`, `user.updated`, `user.deleted`, `organization.created`, `organizationMembership.created`
   - Signing Secretをメモ

### 0-6. Resend（テナントごとのカスタムFromアドレス対応）
1. https://resend.com → GitHubでサインイン
2. Domains → "Add Domain" → `<YOUR_DOMAIN>` を追加
3. CloudflareにDNSレコード（TXT, MX, DKIM）を追加 → 認証完了を確認
4. API Keys → "Create API Key" → 名前: `close-media-production`
5. **生成されたAPIキーをメモ**（`re_XXXXX`）

### 0-7. Stripe（テナント向けSaaSサブスク課金）
1. https://stripe.com/jp → アカウント作成
2. Dashboard → Developers → API Keys から:
   - `Publishable key`（`pk_live_...`）
   - `Secret key`（`sk_live_...`）をメモ
3. Products で以下のプランを作成:

   **【SaaS料金: テナントオーナー向け】**
   | プラン | 価格 | 会員上限 | 特徴 |
   |--------|------|---------|------|
   | Starter | ¥5,000/月 | 100名 | 基本機能 |
   | Growth | ¥15,000/月 | 1,000名 | AI推薦 + 分析 |
   | Scale | ¥50,000/月 | 無制限 | カスタムドメイン + API |

4. 各プランの `price_XXXX` IDをメモ
5. Connect → "Get started"（テナントの会員向け課金に使用）
6. Webhooks → URLはVercelデプロイ後に設定

### 0-8. Upstash（テナント別レート制限・キャッシュ）
1. https://upstash.com → GitHubでサインイン
2. "Create Database" → 名前: `close-media`, リージョン: `ap-northeast-1`
3. REST URL と REST TOKEN をメモ

### 0-9. Pinecone（テナント横断AIコンテンツ推薦）
1. https://www.pinecone.io → アカウント作成
2. "Create Index":
   - Name: `content-embeddings`
   - Dimensions: `1536`
   - Metric: `cosine`
3. `PINECONE_API_KEY` をメモ

### 0-10. PostHog（SaaSメトリクス分析）
1. https://posthog.com → アカウント作成
2. Project API Key をメモ
3. Host: `https://us.posthog.com` をメモ

### 0-11. Sentry（テナント横断エラー監視）
1. https://sentry.io → アカウント作成
2. "Create Project" → Platform: `Next.js`
3. DSN をメモ

### 0-12. Vercel（ワイルドカードサブドメイン対応ホスティング）
1. https://vercel.com → GitHubでサインイン
2. "Add New Project" → `close-media` リポジトリをインポート
3. Settings → Domains:
   - `<YOUR_DOMAIN>` を追加
   - `*.<YOUR_DOMAIN>`（ワイルドカード）を追加
4. 環境変数は後で設定（全変数を設定してから最初のデプロイ）

---

## ■ PHASE 1: SaaS要件定義

### アーキテクチャ方針

#### マルチテナント設計（Row-Level Isolation）
```
Supabase PostgreSQL（1つのDB）
├── tenants テーブル（テナント情報）
├── profiles テーブル（全テナントの会員 + tenant_id外部キー）
├── contents テーブル（全テナントのコンテンツ + tenant_id外部キー）
└── ... 全テーブルに tenant_id を付与

RLSポリシーで tenant_id によるデータ分離を保証
```

#### サブドメインルーティング
```
closemedia.io              → ランディングページ + テナント作成
app.closemedia.io          → スーパー管理者ダッシュボード
[slug].closemedia.io       → テナントのコミュニティサイト
```

#### 認証の階層
```
Clerk Organizations = テナント
  ├── org:admin role  → テナント管理者
  └── org:member role → 一般会員

Supabase profiles.role
  ├── super_admin  → CloseMedia運営
  ├── tenant_admin → テナント管理者
  └── member       → 一般会員
```

### 機能要件（SaaS視点で再定義）

#### 【テナント管理機能】
- テナント作成フロー（Stripe課金 → Supabase登録 → サブドメイン発行）
- テナント設定: コミュニティ名・ロゴ・カラー・説明文
- カスタムドメイン設定（Scaleプランのみ）
- 会員数上限管理（プラン別）
- テナントのデータエクスポート（CSV/JSON）
- テナント削除・解約フロー

#### 【会員管理機能（テナント内）】
- 招待コード制の入会審査（既存機能を継承）
- 会員ランク: standard / gold / platinum / diamond
- 会員ID自動採番（テナント固有プレフィックス: `JK-`→テナント設定可能）
- 会員のStripeサブスク管理（テナントオーナーが価格設定）
- 管理者による承認・停止・ランク変更

#### 【コンテンツ管理機能（テナント内）】
- 記事 / 動画 / 外部リンク（既存機能継承）
- ランク別コンテンツゲーティング
- AI類似コンテンツ推薦（Pinecone）
- コンテンツのいいね / ブックマーク / 閲覧数

#### 【紹介・報酬システム（テナント内）】
- 永続的招待コード（既存機能継承）
- 紹介マイルストーン報酬（テナントオーナーが設定可能）
- 紹介トラッキング（クリック数・登録数）

#### 【課金機能】
- **テナント向けSaaSサブスク**: CloseMedia → テナントオーナーへの課金
- **会員向けサブスク**: テナントオーナー → 会員への課金（Stripe Connect）
- Webhook経由でのランク自動更新

#### 【メール通知】
- テナントドメインからの送信（Resendカスタムドメイン対応）
- 招待メール / 承認待ちメール / 承認完了メール / 新着コンテンツ通知

#### 【分析・モニタリング】
- PostHog: テナント別ダッシュボード（ページビュー・エンゲージメント）
- Sentry: エラー監視（tenant_id をコンテキストに付与）
- Upstash: テナント別レート制限

#### 【スーパー管理者機能】
- 全テナント一覧・ステータス管理
- 課金状況（Stripeダッシュボード統合）
- グローバルコンテンツモデレーション
- プラットフォーム全体のアナリティクス

---

## ■ PHASE 2: Claude Codeへの開発依頼プロンプト

---

以下をClaude Codeに貼り付けてください。

---

```
# CloseMedia — SaaS型クローズドコミュニティプラットフォーム 新規構築

## プロジェクト概要
招待制クローズドコミュニティを誰でも作れるSaaSプラットフォームを構築する。
既存の実装例 `closed-media-ui`（TheJapanLocalMedia）のUI/UX・機能を参考に、
マルチテナント対応のSaaSとして再設計する。

参考コード: /Users/[あなたのパス]/closed-media-ui

## 使用スタック
- Next.js 15 (App Router) + React 19 + TypeScript strict
- shadcn/ui + Tailwind CSS
- Clerk（Organizations機能でマルチテナント認証）
- Supabase PostgreSQL（RLSによるテナントデータ分離）
- Stripe + Stripe Connect（SaaSサブスク + 会員課金）
- Resend + React Email（メール通知）
- Upstash Redis（テナント別レート制限・キャッシュ）
- Pinecone（AIコンテンツ推薦）
- PostHog（プロダクト分析）
- Sentry（エラー監視）
- Vercel（ワイルドカードサブドメイン対応）

## ステップ1: プロジェクト初期化

```bash
npx create-next-app@latest close-media \
  --typescript --tailwind --app --src-dir --import-alias "@/*"
cd close-media
```

```bash
npm install \
  @clerk/nextjs \
  @supabase/supabase-js \
  @upstash/redis \
  @upstash/ratelimit \
  @pinecone-database/pinecone \
  openai \
  stripe \
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
npx shadcn@latest add button input label card badge avatar dialog sheet tabs select textarea toast toaster alert separator skeleton progress switch
```

## ステップ2: 環境変数

`.env.local`:
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Stripe（SaaSサブスク）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_STARTER=price_xxx     # ¥5,000/月
STRIPE_PRICE_GROWTH=price_xxx      # ¥15,000/月
STRIPE_PRICE_SCALE=price_xxx       # ¥50,000/月

# Resend
RESEND_API_KEY=re_xxx
RESEND_FROM_DOMAIN=yourdomain.com

# Upstash
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Pinecone
PINECONE_API_KEY=xxx
PINECONE_INDEX=content-embeddings

# OpenAI（Embedding生成用）
OPENAI_API_KEY=sk-xxx

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_DOMAIN=yourdomain.com
```

## ステップ3: Supabaseデータベースセットアップ

Supabase SQL Editor で以下を順番に実行:

### 3-1: 拡張機能と型定義
```sql
create extension if not exists "pgcrypto";

create type member_rank as enum ('standard', 'gold', 'platinum', 'diamond');
create type user_role as enum ('member', 'tenant_admin', 'super_admin');
create type user_status as enum ('pending', 'active', 'suspended');
create type content_type as enum ('article', 'video', 'external');
create type content_status as enum ('draft', 'scheduled', 'published');
create type interaction_type as enum ('view', 'like', 'bookmark');
create type tenant_plan as enum ('starter', 'growth', 'scale');
create type tenant_status as enum ('active', 'suspended', 'cancelled');
create type unlock_condition_type as enum (
  'content_views_3', 'profile_completed', 'first_share', 'feedback_sent'
);

create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
```

### 3-2: テナントテーブル（SaaSの核心）
```sql
create table tenants (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,           -- サブドメイン用（例: japan-local-media）
  name                  text not null,                  -- コミュニティ名
  description           text,
  logo_url              text,
  primary_color         text not null default '#1B3022',
  accent_color          text not null default '#D4AF37',
  custom_domain         text unique,                    -- Scaleプランのみ
  member_id_prefix      text not null default 'MB',     -- 会員IDプレフィックス（例: JK-）
  owner_id              text not null,                  -- ClerkユーザーID
  clerk_org_id          text unique,                    -- Clerk Organization ID
  plan                  tenant_plan not null default 'starter',
  status                tenant_status not null default 'active',
  member_limit          int not null default 100,       -- プラン別上限
  stripe_customer_id    text unique,
  stripe_subscription_id text unique,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger trg_tenants_updated before update on tenants
  for each row execute function update_updated_at();
create index idx_tenants_slug on tenants(slug);
create index idx_tenants_custom_domain on tenants(custom_domain);
create index idx_tenants_clerk_org on tenants(clerk_org_id);
```

### 3-3: プロフィールテーブル（テナント対応）
```sql
create table profiles (
  id                    text primary key,   -- ClerkユーザーID
  tenant_id             uuid not null references tenants(id) on delete cascade,
  member_id             text not null,      -- テナント内の会員ID（例: JK-00001）
  display_name          text not null,
  email                 text not null,
  phone                 text,
  bio                   text,
  location              text,
  company               text,
  position              text,
  avatar_url            text,
  rank                  member_rank not null default 'standard',
  role                  user_role not null default 'member',
  status                user_status not null default 'pending',
  screening_answer      text,
  invited_by            text references profiles(id),
  stripe_customer_id    text,
  stripe_subscription_id text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique(tenant_id, member_id),
  unique(tenant_id, email)
);

-- テナント内で連番のmember_idを採番
create or replace function generate_member_id()
returns trigger as $$
declare
  prefix text;
  next_num int;
begin
  select t.member_id_prefix into prefix from tenants t where t.id = new.tenant_id;
  select coalesce(
    max(substring(member_id from length(prefix) + 2)::int), 0
  ) + 1 into next_num
  from profiles where tenant_id = new.tenant_id;
  new.member_id := prefix || '-' || lpad(next_num::text, 5, '0');
  return new;
end;
$$ language plpgsql;

create trigger trg_member_id
  before insert on profiles
  for each row execute function generate_member_id();
create trigger trg_profiles_updated before update on profiles
  for each row execute function update_updated_at();
create index idx_profiles_tenant on profiles(tenant_id);
create index idx_profiles_email on profiles(tenant_id, email);
```

### 3-4: 招待コード・紹介テーブル
```sql
create table invite_codes (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  code        text not null,
  created_by  text not null references profiles(id),
  is_used     boolean not null default false,
  click_count int not null default 0,
  expires_at  timestamptz,
  created_at  timestamptz not null default now(),
  unique(tenant_id, code)
);
create index idx_invite_codes on invite_codes(tenant_id, code);

create table referrals (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  referrer_id     text not null references profiles(id),
  referred_id     text references profiles(id),
  invite_code_id  uuid references invite_codes(id),
  clicked_at      timestamptz not null default now(),
  registered_at   timestamptz
);
create index idx_referrals_referrer on referrals(tenant_id, referrer_id);

create table invite_slots (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  user_id       text not null references profiles(id) on delete cascade,
  initial_slots int not null default 2,
  bonus_slots   int not null default 0,
  used_slots    int not null default 0,
  updated_at    timestamptz not null default now(),
  unique(tenant_id, user_id)
);

create table slot_unlock_conditions (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  user_id       text not null references profiles(id) on delete cascade,
  condition     unlock_condition_type not null,
  completed     boolean not null default false,
  completed_at  timestamptz,
  unique(tenant_id, user_id, condition)
);
```

### 3-5: コンテンツテーブル
```sql
create table contents (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  type            content_type not null,
  title           text not null,
  description     text,
  body            text,
  status          content_status not null default 'draft',
  publish_date    timestamptz,
  author_id       text references profiles(id),
  author_name     text not null,
  author_bio      text,
  thumbnail_url   text,
  url             text,
  duration        text,
  views           int not null default 0,
  likes           int not null default 0,
  premium         boolean not null default false,
  required_rank   member_rank not null default 'standard',
  embedding_synced boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_contents_updated before update on contents
  for each row execute function update_updated_at();
create index idx_contents_tenant on contents(tenant_id, status);
create index idx_contents_publish on contents(tenant_id, publish_date desc);

create table tags (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name      text not null,
  unique(tenant_id, name)
);

create table content_tags (
  content_id  uuid not null references contents(id) on delete cascade,
  tag_id      uuid not null references tags(id) on delete cascade,
  primary key (content_id, tag_id)
);

create table content_interactions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  user_id     text not null references profiles(id) on delete cascade,
  content_id  uuid not null references contents(id) on delete cascade,
  type        interaction_type not null,
  created_at  timestamptz not null default now(),
  unique(user_id, content_id, type)
);
create index idx_interactions on content_interactions(tenant_id, content_id, type);
```

### 3-6: 報酬・通知テーブル
```sql
create table rewards (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants(id) on delete cascade,
  title               text not null,
  description         text not null,
  required_referrals  int not null,
  icon                text not null default 'Gift',
  status              text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at          timestamptz not null default now()
);

create table reward_claims (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  user_id     text not null references profiles(id) on delete cascade,
  reward_id   uuid not null references rewards(id) on delete cascade,
  status      text not null default 'pending'
    check (status in ('pending', 'granted', 'rejected')),
  claimed_at  timestamptz not null default now(),
  granted_at  timestamptz,
  unique(user_id, reward_id)
);

create table broadcasts (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  title       text not null,
  body        text not null,
  target_rank text not null default 'all',
  status      text not null default 'sent'
    check (status in ('sent', 'failed', 'scheduled')),
  sent_at     timestamptz not null default now(),
  created_by  text references profiles(id)
);

create table notification_preferences (
  user_id               text not null references profiles(id) on delete cascade,
  tenant_id             uuid not null references tenants(id) on delete cascade,
  email_new_content     boolean not null default true,
  email_newsletter      boolean not null default true,
  email_invite_update   boolean not null default true,
  push_browser          boolean not null default false,
  updated_at            timestamptz not null default now(),
  primary key (user_id, tenant_id)
);

create table login_history (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  user_id       text not null references profiles(id) on delete cascade,
  device        text,
  ip_address    text,
  logged_in_at  timestamptz not null default now()
);
create index idx_login_history on login_history(tenant_id, user_id, logged_in_at desc);
```

### 3-7: RLSポリシー（テナント分離）
```sql
-- 全テーブルのRLS有効化
alter table tenants enable row level security;
alter table profiles enable row level security;
alter table invite_codes enable row level security;
alter table referrals enable row level security;
alter table invite_slots enable row level security;
alter table slot_unlock_conditions enable row level security;
alter table contents enable row level security;
alter table tags enable row level security;
alter table content_tags enable row level security;
alter table content_interactions enable row level security;
alter table rewards enable row level security;
alter table reward_claims enable row level security;
alter table broadcasts enable row level security;
alter table notification_preferences enable row level security;
alter table login_history enable row level security;

-- Note: サーバーサイドのServer ActionはService Roleを使用するため
-- RLSはService Roleでバイパスされる。クライアント側の安全弁として設定。
-- 実装上は全DB操作をサーバーサイドServer Actions経由で行うこと。
```

### 3-8: 初期データ
```sql
-- スーパー管理者用テナントの作成（ClerkユーザーIDは後で更新）
insert into tenants (slug, name, description, owner_id, plan, member_limit) values
  ('system', 'CloseMedia System', 'Platform administration', 'pending', 'scale', 999999);
```

## ステップ4: ディレクトリ構成と実装

```
src/
├── app/
│   ├── layout.tsx                    # ClerkProvider + PostHog + Sentry（グローバル）
│   ├── middleware.ts                  # テナント解決 + Clerk認証ガード
│   ├── page.tsx                       # ランディングページ（SaaS紹介）
│   ├── pricing/page.tsx               # 料金プランページ
│   ├── onboarding/page.tsx            # テナント作成オンボーディング
│   ├── dashboard/page.tsx             # テナントオーナー管理ダッシュボード
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── [tenant]/                      # テナント別コミュニティサイト
│   │   ├── layout.tsx                 # テナントデータ取得・ブランド適用
│   │   ├── page.tsx                   # ログインページ
│   │   ├── signup/page.tsx            # 招待コード付きサインアップ
│   │   ├── signup/complete/page.tsx   # スクリーニング質問
│   │   ├── feed/page.tsx              # コンテンツフィード
│   │   ├── article/[id]/page.tsx      # 記事詳細
│   │   ├── mypage/page.tsx            # マイページ
│   │   ├── favorites/page.tsx         # お気に入り
│   │   ├── settings/page.tsx          # 設定
│   │   └── admin/page.tsx             # テナント管理者ダッシュボード
│   ├── super-admin/                   # スーパー管理者（CloseMedia運営）
│   │   └── page.tsx                   # 全テナント管理
│   └── api/
│       ├── webhooks/
│       │   ├── clerk/route.ts         # Clerk Webhook
│       │   └── stripe/route.ts        # Stripe Webhook
│       ├── stripe/
│       │   ├── checkout/route.ts      # SaaSサブスク購入
│       │   ├── member-checkout/route.ts # 会員向け課金
│       │   └── portal/route.ts        # カスタマーポータル
│       └── recommend/[tenantId]/route.ts # Pinecone推薦API
├── actions/
│   ├── tenant.ts                      # テナントCRUD
│   ├── auth.ts                        # 招待コード検証・プロフィール
│   ├── content.ts                     # コンテンツCRUD
│   ├── profile.ts                     # プロフィール・招待コード
│   ├── interactions.ts                # インタラクション
│   └── admin.ts                       # 管理者操作
├── lib/
│   ├── supabase.ts                    # Supabaseクライアント
│   ├── stripe.ts                      # Stripeクライアント
│   ├── redis.ts                       # Upstash Redis
│   ├── pinecone.ts                    # Pineconeクライアント
│   ├── tenant.ts                      # テナント解決ユーティリティ
│   ├── email/
│   │   ├── index.ts                   # Resend送信ラッパー
│   │   └── templates/
│   │       ├── welcome.tsx
│   │       ├── approval.tsx
│   │       └── invite.tsx
│   └── types.ts                       # 共通型定義
└── components/
    ├── ui/                            # shadcn/ui
    ├── tenant/                        # テナントブランディング対応コンポーネント
    ├── admin/                         # 管理画面
    └── marketing/                     # ランディングページ・料金ページ
```

## ステップ5: テナント解決ミドルウェア

`src/app/middleware.ts`:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
  '/[^/]+/sign-in(.*)',    // テナントサインインページ
  '/[^/]+/signup(.*)',     // テナントサインアップページ
])

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl
  const hostname = req.headers.get('host') || ''
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN!

  // カスタムドメイン解決
  if (!hostname.includes(appDomain) && !hostname.includes('localhost')) {
    // カスタムドメインの場合、Supabaseでテナントを検索
    // X-Tenant-Slug ヘッダーをセットして後続処理で使用
    const response = NextResponse.next()
    response.headers.set('X-Custom-Domain', hostname)
    return response
  }

  // サブドメイン解決: [slug].closemedia.io
  const subdomain = hostname.replace(`.${appDomain}`, '')
  if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
    const response = NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}`, req.url))
    response.headers.set('X-Tenant-Slug', subdomain)
    return response
  }

  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

## ステップ6: Clerk Webhook（テナント + プロフィール作成）

`src/app/api/webhooks/clerk/route.ts`:
```typescript
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!
  const headerPayload = headers()
  const body = await req.text()

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent
  try {
    evt = wh.verify(body, {
      'svix-id': headerPayload.get('svix-id')!,
      'svix-timestamp': headerPayload.get('svix-timestamp')!,
      'svix-signature': headerPayload.get('svix-signature')!,
    }) as WebhookEvent
  } catch {
    return new Response('Invalid webhook', { status: 400 })
  }

  // 新規ユーザー登録（テナント招待経由）
  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url, unsafe_metadata } = evt.data
    const email = email_addresses[0]?.email_address!
    const displayName = [first_name, last_name].filter(Boolean).join(' ') || email.split('@')[0]
    const inviteCode = (unsafe_metadata as any)?.invite_code as string | undefined
    const tenantSlug = (unsafe_metadata as any)?.tenant_slug as string | undefined

    if (!tenantSlug) return new Response('No tenant slug', { status: 400 })

    // テナント取得
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id, member_limit')
      .eq('slug', tenantSlug)
      .single()

    if (!tenant) return new Response('Tenant not found', { status: 404 })

    // 会員数上限チェック
    const { count } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
    if ((count || 0) >= tenant.member_limit) {
      return new Response('Member limit reached', { status: 403 })
    }

    // 招待者特定
    let invitedBy: string | null = null
    let inviteCodeId: string | null = null
    if (inviteCode) {
      const { data: code } = await supabaseAdmin
        .from('invite_codes')
        .select('id, created_by')
        .eq('tenant_id', tenant.id)
        .eq('code', inviteCode)
        .single()
      if (code) { invitedBy = code.created_by; inviteCodeId = code.id }
    }

    // プロフィール作成
    await supabaseAdmin.from('profiles').insert({
      id, tenant_id: tenant.id, display_name: displayName,
      email, avatar_url: image_url, invited_by: invitedBy,
      status: 'pending', role: 'member', rank: 'standard',
    })

    // 初期データ一括挿入
    await Promise.all([
      supabaseAdmin.from('invite_slots').insert({ tenant_id: tenant.id, user_id: id }),
      supabaseAdmin.from('slot_unlock_conditions').insert([
        { tenant_id: tenant.id, user_id: id, condition: 'content_views_3' },
        { tenant_id: tenant.id, user_id: id, condition: 'profile_completed' },
        { tenant_id: tenant.id, user_id: id, condition: 'first_share' },
        { tenant_id: tenant.id, user_id: id, condition: 'feedback_sent' },
      ]),
      supabaseAdmin.from('notification_preferences').insert({ user_id: id, tenant_id: tenant.id }),
    ])

    // 紹介トラッキング
    if (invitedBy && inviteCodeId) {
      await supabaseAdmin.from('referrals').insert({
        tenant_id: tenant.id, referrer_id: invitedBy,
        referred_id: id, invite_code_id: inviteCodeId,
        registered_at: new Date().toISOString(),
      })
    }

    await sendWelcomeEmail({ email, displayName, tenantSlug })
  }

  // テナント作成（Stripe課金完了後にorganization.createdが発火）
  if (evt.type === 'organization.created') {
    const { id: clerkOrgId, name, slug, created_by } = evt.data
    // Stripe課金が先に完了している前提でテナントのclerk_org_idを更新
    await supabaseAdmin
      .from('tenants')
      .update({ clerk_org_id: clerkOrgId, name })
      .eq('slug', slug)
      .eq('owner_id', created_by)
  }

  if (evt.type === 'user.deleted') {
    await supabaseAdmin.from('profiles').delete().eq('id', evt.data.id)
  }

  return new Response('OK', { status: 200 })
}
```

## ステップ7: Stripe Webhook（SaaSプラン + 会員ランク更新）

`src/app/api/webhooks/stripe/route.ts`:
```typescript
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const SAAS_PLAN_MAP: Record<string, tenant_plan> = {
  [process.env.STRIPE_PRICE_STARTER!]: 'starter',
  [process.env.STRIPE_PRICE_GROWTH!]: 'growth',
  [process.env.STRIPE_PRICE_SCALE!]: 'scale',
}

const MEMBER_LIMIT_MAP: Record<string, number> = {
  starter: 100, growth: 1000, scale: 999999
}

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  const subscription = event.data.object as Stripe.Subscription
  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0]?.price.id

  if (event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated') {
    const plan = SAAS_PLAN_MAP[priceId]
    if (plan) {
      // SaaSサブスク（テナントオーナー向け）
      await supabaseAdmin
        .from('tenants')
        .update({
          plan,
          member_limit: MEMBER_LIMIT_MAP[plan],
          stripe_subscription_id: subscription.id,
          status: 'active',
        })
        .eq('stripe_customer_id', customerId)
    } else {
      // 会員向けサブスク（テナント内）
      const memberRank = getMemberRank(priceId) // テナントが設定したPrice IDから判定
      if (memberRank) {
        await supabaseAdmin
          .from('profiles')
          .update({ rank: memberRank, stripe_subscription_id: subscription.id })
          .eq('stripe_customer_id', customerId)
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    // SaaSサブスク解約
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()
    if (tenant) {
      await supabaseAdmin
        .from('tenants')
        .update({ plan: 'starter', member_limit: 100, stripe_subscription_id: null, status: 'suspended' })
        .eq('id', tenant.id)
    } else {
      // 会員サブスク解約
      await supabaseAdmin
        .from('profiles')
        .update({ rank: 'standard', stripe_subscription_id: null })
        .eq('stripe_customer_id', customerId)
    }
  }

  return new Response('OK', { status: 200 })
}

function getMemberRank(priceId: string): string | null {
  // テナントが設定したStripe Price IDマッピングを取得
  // 実装: テナントのprice設定テーブルから検索
  return null // 実装省略
}
```

## ステップ8: テナントオンボーディングフロー

`src/app/onboarding/page.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { createTenant } from '@/actions/tenant'

// フロー: コミュニティ情報入力 → Stripe決済 → テナント作成 → 管理ダッシュボードへ
export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [step, setStep] = useState<'info' | 'plan' | 'payment'>('info')
  const [tenantData, setTenantData] = useState({
    name: '', slug: '', description: '',
    primaryColor: '#1B3022', accentColor: '#D4AF37',
    memberIdPrefix: 'MB',
  })

  const handlePlanSelect = async (priceId: string) => {
    // Stripeチェックアウトセッション作成
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, tenantData }),
    })
    const { url } = await res.json()
    router.push(url) // Stripeチェックアウトページへ
  }

  // UIは既存のclosed-media-uiのデザインを参考に実装
  return (
    <div>
      {/* ステップ別フォームUI */}
    </div>
  )
}
```

## ステップ9: テナント別コミュニティサイト

`src/app/[tenant]/layout.tsx`:
```typescript
import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { tenant: string }
}) {
  // テナント情報取得（スラグまたはカスタムドメインで解決）
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('slug', params.tenant)
    .eq('status', 'active')
    .single()

  if (!tenant) notFound()

  return (
    <div
      style={{
        '--color-primary': tenant.primary_color,
        '--color-accent': tenant.accent_color,
      } as React.CSSProperties}
    >
      {/* テナントのブランドカラー・ロゴを適用 */}
      {children}
    </div>
  )
}
```

`src/app/[tenant]/feed/page.tsx`:
既存の `closed-media-ui/app/feed/page.tsx` を参考に、
テナントID (`params.tenant` から解決) でフィルタリングして実装。

## ステップ10: 料金ページ（SaaS）

`src/app/pricing/page.tsx`:
```typescript
// SaaSの料金プランを表示するランディングページ
// プランカード: Starter (¥5,000) / Growth (¥15,000) / Scale (¥50,000)
// 各プランの特徴、会員上限、機能一覧を表示
// 「始める」ボタン → /onboarding へ遷移
```

## ステップ11: Vercel設定 + デプロイ

1. Vercel → プロジェクト → Settings → Environment Variables に全変数を設定
2. Settings → Domains:
   - `closemedia.io`（または取得したドメイン）を追加
   - `*.closemedia.io`（ワイルドカード）を追加
3. GitHubにpush → 自動デプロイ

4. `vercel.json` を作成:
```json
{
  "rewrites": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "(?<subdomain>[^.]+)\\.closemedia\\.io"
        }
      ],
      "destination": "/:subdomain/:path*"
    }
  ]
}
```

5. Stripe Webhookを本番URLで設定

## ステップ12: スーパー管理者設定

```sql
-- 自分のClerkユーザーIDを確認してから実行
-- まずシステムテナントのowner_idを更新
update tenants set owner_id = 'user_YOUR_CLERK_ID' where slug = 'system';

-- スーパー管理者プロフィールを手動作成
insert into profiles (id, tenant_id, display_name, email, role, status, rank)
select
  'user_YOUR_CLERK_ID',
  id,
  'Admin',
  'your-email@example.com',
  'super_admin',
  'active',
  'diamond'
from tenants where slug = 'system';
```

## ステップ13: SaaS固有の追加機能（Growth以降のみ）

### AIコンテンツ推薦（Pinecone + OpenAI Embedding）
- コンテンツ公開時にEmbedding生成 → Pineconeにテナントごとのnamespace でインデックス
- `namespace: tenant_id` でテナントデータを分離
- `/api/recommend/[tenantId]` エンドポイント経由で類似コンテンツを返却

### テナント別分析（PostHog）
- `posthog.group('tenant', tenantId)` でテナント単位の集計
- イベント: `content_viewed`, `content_liked`, `member_invited`, `subscription_started`

### エラー監視（Sentry）
- `Sentry.setTag('tenant_id', tenantId)` でエラーをテナントに紐付け
- テナント別エラーレートをダッシュボードで確認

## ステップ14: 最終確認チェックリスト

**SaaSフロー:**
- [ ] ランディングページ → 料金ページ → オンボーディング
- [ ] Stripe決済 → テナント作成 → Clerk Organization作成
- [ ] サブドメイン発行（`[slug].closemedia.io`）
- [ ] テナント管理ダッシュボード（コンテンツ・会員・報酬管理）

**テナント内コミュニティフロー:**
- [ ] 招待コード付きサインアップ → Clerk登録 → Webhook → Supabaseプロフィール作成
- [ ] 管理者承認 → 承認完了メール（Resend）
- [ ] コンテンツ閲覧（ランク制限）/ いいね / ブックマーク
- [ ] マイページ（招待リンク・紹介報酬）
- [ ] 会員向けStripeサブスク → ランク自動更新

**インフラ:**
- [ ] ワイルドカードサブドメイン動作確認
- [ ] カスタムドメイン動作確認（Scaleプラン）
- [ ] Upstashレート制限（招待コード検証）
- [ ] Pinecone AIレコメンデーション（Growth以上）
- [ ] PostHog + Sentry 稼働確認

## 実装上の注意事項

1. **テナント解決は常に最初に**: Server Actionsでtenant_idを必ず検証。
   URLパラメータの`tenant`スラグから`tenants`テーブルで実IDを取得する。

2. **RLSよりServer Actionsでのtenant_id検証を優先**:
   全DB操作はService Role経由。`where tenant_id = resolvedTenantId` を必ず追加。

3. **Clerkのunsafe_metadataで招待コードを渡す**:
   サインアップフォームで `clerk.user.update({ unsafeMetadata: { invite_code, tenant_slug } })`

4. **Pineconeのnamespaceでテナント分離**:
   `index.namespace(tenantId).upsert(...)` / `index.namespace(tenantId).query(...)`

5. **PostHogのgroup機能でテナント分析**:
   `posthog.group('tenant', tenantId, { name: tenantName, plan: tenantPlan })`

6. **Stripe Connectの検討**:
   テナントオーナーが会員に課金する場合、Stripe Connectが必要。
   初期フェーズはオーナーが自前のStripeアカウントを設定する方式でも可。

7. **既存UIの再利用**:
   `closed-media-ui/components/` のコンポーネントを最大限流用。
   テナントのブランドカラーはCSS変数で上書きする設計。

8. **SaaSのprice設定ページ**:
   Growth以上のテナントはダッシュボードから会員向けStripe Price IDを設定可能にする。

## 参考にすべき既存コードのパス

- 全ページのUIデザイン: `closed-media-ui/app/`
- 型定義: `closed-media-ui/lib/types.ts`
- Server Actionsパターン: `closed-media-ui/app/actions/`
- 管理者UIコンポーネント: `closed-media-ui/components/admin/`
- Supabaseクライアント設定: `closed-media-ui/lib/supabase/`
- DBスキーマ（移行前）: `closed-media-ui/supabase/migrations/`
```

---

## ■ PHASE 3: SaaSコスト試算

| サービス | 費用 | 備考 |
|---------|------|------|
| Claude | ¥3,000/月 | AI開発補助 |
| Namecheap | ¥150/月 | ドメイン |
| Supabase | ¥0〜¥3,400/月 | Free→Pro（8GBまで） |
| Clerk | ¥0〜¥4,000/月 | Free（月1万ユーザー）→Pro |
| Vercel | ¥0〜¥2,700/月 | Hobby→Pro（商用） |
| Cloudflare | ¥0 | Free DNS |
| Resend | ¥0〜 | Free（月3,000通） |
| Stripe | 売上の3.6% | 固定費なし |
| Upstash | ¥0 | Free（月10,000コマンド） |
| Pinecone | ¥0〜¥2,800/月 | Free→Starter |
| PostHog | ¥0 | Free（月100万イベント） |
| Sentry | ¥0 | Free（月5,000エラー） |
| **固定費（初期）** | **¥3,150/月** | 全サービスFree利用時 |
| **固定費（スケール後）** | **〜¥15,000/月** | Pro tier移行時 |

> **SaaS収益がコストを上回るタイミング**:
> Starterテナント3社（¥5,000×3 = ¥15,000/月）で固定費を賄える。

---

## ■ PHASE 4: 開発優先順位（MVP → スケール）

### MVP（最初に作るもの）
1. ランディングページ + 料金ページ
2. テナント作成オンボーディング（Stripe課金込み）
3. テナント別コミュニティ（既存機能を流用）
4. Clerk + Supabase連携

### Phase 2（MVPリリース後）
5. テナントダッシュボード（分析・設定）
6. 会員向けStripeサブスク
7. Pinecone AIレコメンデーション
8. カスタムドメイン（Scaleプラン）

### Phase 3（成長期）
9. Stripe Connect（テナントへの収益分配）
10. APIアクセス（Scaleプラン）
11. スーパー管理者ダッシュボード
12. テナントデータエクスポート
