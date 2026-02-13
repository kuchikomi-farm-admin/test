# TheJapanLocalMedia バックエンド要件定義書

> **前提:** Supabase (Database/Auth/Storage) + Vercel (Hosting/Edge Functions) の無料枠内で運用
> **制約:** 現行UIは一切変更しない。Zustand ストアのインターフェースを維持し、データソースのみ差し替える

---

## 1. Supabase テーブル定義 (SQL スキーマ)

### 1-1. ER 概要

```
auth.users (Supabase Auth 管理)
  │
  └─── profiles (1:1)
         │
         ├─── invite_codes (発行した招待コード)
         ├─── referrals (招待実績)
         ├─── invite_slots (招待枠)
         ├─── slot_unlock_conditions (枠解放条件)
         ├─── content_interactions (いいね/ブックマーク/閲覧)
         └─── notification_preferences (通知設定)

contents
  │
  ├─── content_tags (多対多)
  └─── content_views (閲覧ログ)

rewards (特典マスター)
  └─── reward_claims (特典付与実績)

broadcasts (配信履歴)

admin_stats_snapshots (統計スナップショット ※集計用)
```

### 1-2. SQL マイグレーション

```sql
-- ============================================================
-- 0. Extensions
-- ============================================================
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_trgm";    -- 日本語あいまい検索 (optional)

-- ============================================================
-- 1. profiles — ユーザープロフィール (auth.users と 1:1)
-- ============================================================
create type member_rank as enum (
  'standard', 'gold', 'platinum', 'diamond'
);

create type user_role as enum ('member', 'admin');

create type user_status as enum ('pending', 'active', 'suspended');

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  member_id     text unique not null,                       -- "JK-00247"
  display_name  text not null,
  email         text not null,
  phone         text,
  bio           text,
  location      text,
  company       text,
  position      text,
  avatar_url    text,
  rank          member_rank not null default 'standard',
  role          user_role not null default 'member',
  status        user_status not null default 'pending',     -- 審査制
  screening_answer text,                                    -- 登録時の審査回答
  invited_by    uuid references profiles(id),               -- 誰に招待されたか
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- member_id の自動採番 (JK-00001 〜)
create or replace function generate_member_id()
returns trigger as $$
begin
  new.member_id := 'JK-' || lpad(
    (select coalesce(max(substring(member_id from 4)::int), 0) + 1
     from profiles)::text, 5, '0');
  return new;
end;
$$ language plpgsql;

create trigger trg_member_id
  before insert on profiles
  for each row execute function generate_member_id();

-- updated_at の自動更新
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated
  before update on profiles
  for each row execute function update_updated_at();

-- ============================================================
-- 2. invite_codes — 招待コード
-- ============================================================
create table invite_codes (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,                       -- "XXXX-XXXX-XXXX"
  created_by    uuid not null references profiles(id),
  used_by       uuid references profiles(id),               -- 使用済みなら紐付く
  is_used       boolean not null default false,
  expires_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index idx_invite_codes_code on invite_codes(code);

-- ============================================================
-- 3. invite_slots — 招待枠管理
-- ============================================================
create table invite_slots (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  initial_slots int not null default 2,
  bonus_slots   int not null default 0,
  used_slots    int not null default 0,
  updated_at    timestamptz not null default now(),
  unique(user_id)
);

-- ============================================================
-- 4. slot_unlock_conditions — 枠解放条件の達成状況
-- ============================================================
create type unlock_condition_type as enum (
  'content_views_3',       -- コンテンツ3本視聴完了
  'profile_completed',     -- プロフィール完成
  'first_share',           -- 初回記事シェア
  'feedback_sent'          -- フィードバック送信
);

create table slot_unlock_conditions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  condition     unlock_condition_type not null,
  completed     boolean not null default false,
  completed_at  timestamptz,
  unique(user_id, condition)
);

-- ============================================================
-- 5. referrals — 招待実績 (クリック・登録のトラッキング)
-- ============================================================
create table referrals (
  id              uuid primary key default gen_random_uuid(),
  referrer_id     uuid not null references profiles(id),     -- 紹介者
  referred_id     uuid references profiles(id),              -- 被紹介者 (登録完了時)
  invite_code_id  uuid references invite_codes(id),
  clicked_at      timestamptz not null default now(),         -- クリック日時
  registered_at   timestamptz                                 -- 登録完了日時
);

create index idx_referrals_referrer on referrals(referrer_id);

-- ============================================================
-- 6. contents — コンテンツ
-- ============================================================
create type content_type as enum ('article', 'video', 'external');
create type content_status as enum ('draft', 'scheduled', 'published');

create table contents (
  id              uuid primary key default gen_random_uuid(),
  type            content_type not null,
  title           text not null,
  description     text,
  body            text,                                       -- 記事本文 (Markdown/JSON)
  status          content_status not null default 'draft',
  publish_date    timestamptz,
  author_id       uuid references profiles(id),               -- nullable for external
  author_name     text not null,                               -- 表示用著者名
  author_bio      text,
  thumbnail_url   text,
  url             text,                                        -- external/video URL
  duration        text,                                        -- video duration "48:32"
  views           int not null default 0,
  likes           int not null default 0,
  premium         boolean not null default false,
  required_rank   member_rank not null default 'standard',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_contents_updated
  before update on contents
  for each row execute function update_updated_at();

create index idx_contents_status on contents(status);
create index idx_contents_publish_date on contents(publish_date desc);

-- ============================================================
-- 7. content_tags — タグ (多対多)
-- ============================================================
create table tags (
  id    uuid primary key default gen_random_uuid(),
  name  text unique not null
);

create table content_tags (
  content_id  uuid not null references contents(id) on delete cascade,
  tag_id      uuid not null references tags(id) on delete cascade,
  primary key (content_id, tag_id)
);

-- ============================================================
-- 8. content_interactions — いいね / ブックマーク / 閲覧ログ
-- ============================================================
create type interaction_type as enum ('view', 'like', 'bookmark');

create table content_interactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  content_id    uuid not null references contents(id) on delete cascade,
  type          interaction_type not null,
  created_at    timestamptz not null default now(),
  unique(user_id, content_id, type)                          -- 1ユーザー1コンテンツ1タイプ
);

create index idx_interactions_content on content_interactions(content_id, type);

-- ============================================================
-- 9. rewards — 特典マスター
-- ============================================================
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

-- ============================================================
-- 10. reward_claims — 特典付与実績
-- ============================================================
create table reward_claims (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  reward_id   uuid not null references rewards(id) on delete cascade,
  status      text not null default 'pending'
    check (status in ('pending', 'granted', 'rejected')),
  claimed_at  timestamptz not null default now(),
  granted_at  timestamptz,
  unique(user_id, reward_id)
);

-- ============================================================
-- 11. broadcasts — 配信履歴
-- ============================================================
create table broadcasts (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text not null,
  target_rank   text not null default 'all',                 -- 'all' | member_rank 値
  status        text not null default 'sent'
    check (status in ('sent', 'failed', 'scheduled')),
  sent_at       timestamptz not null default now(),
  created_by    uuid references profiles(id)
);

-- ============================================================
-- 12. notification_preferences — 通知設定
-- ============================================================
create table notification_preferences (
  user_id               uuid primary key references profiles(id) on delete cascade,
  email_new_content     boolean not null default true,
  email_newsletter      boolean not null default true,
  email_invite_update   boolean not null default true,
  line_new_content      boolean not null default false,
  line_reward           boolean not null default true,
  push_browser          boolean not null default false,
  updated_at            timestamptz not null default now()
);

-- ============================================================
-- 13. login_history — ログイン履歴
-- ============================================================
create table login_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  device      text,
  ip_address  text,
  logged_in_at timestamptz not null default now()
);

create index idx_login_history_user on login_history(user_id, logged_in_at desc);
```

### 1-3. Supabase Row Level Security (RLS)

```sql
-- すべてのテーブルで RLS を有効化
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

-- ────────────── profiles ──────────────
create policy "自分のプロフィール閲覧" on profiles
  for select using (auth.uid() = id);

create policy "自分のプロフィール更新" on profiles
  for update using (auth.uid() = id);

create policy "管理者は全プロフィール閲覧" on profiles
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "管理者はステータス変更可能" on profiles
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ────────────── contents ──────────────
-- 公開コンテンツ: ランク条件に基づく閲覧制御
create policy "公開コンテンツ閲覧" on contents
  for select using (
    status = 'published'
    and (
      premium = false
      or required_rank <= (select rank from profiles where id = auth.uid())
    )
  );

-- 管理者は全コンテンツ操作可能
create policy "管理者コンテンツ全操作" on contents
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ────────────── invite_codes ──────────────
create policy "自分の招待コード閲覧" on invite_codes
  for select using (created_by = auth.uid());

create policy "自分の招待コード作成" on invite_codes
  for insert with check (created_by = auth.uid());

-- 招待コード検証は匿名ユーザーでもアクセスできるよう別途 RPC で対応

-- ────────────── content_interactions ──────────────
create policy "自分のインタラクション操作" on content_interactions
  for all using (user_id = auth.uid());

-- ────────────── rewards (全員閲覧可) ──────────────
create policy "特典閲覧" on rewards
  for select using (true);

create policy "管理者特典管理" on rewards
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ────────────── broadcasts (全員閲覧可) ──────────────
create policy "配信閲覧" on broadcasts
  for select using (true);

create policy "管理者配信管理" on broadcasts
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ────────────── notification_preferences ──────────────
create policy "自分の通知設定" on notification_preferences
  for all using (user_id = auth.uid());

-- ────────────── login_history ──────────────
create policy "自分のログイン履歴" on login_history
  for select using (user_id = auth.uid());
```

---

## 2. 認証フロー設計 (Supabase Auth)

### 2-1. クローズド招待制の実現方式

```
┌─────────────────────────────────────────────────────┐
│                  アクセス制御レイヤー                   │
│                                                       │
│  ① 招待コード検証 (匿名 RPC)                         │
│     └→ コード存在 & 未使用 & 未失効 を確認              │
│                                                       │
│  ② Supabase Auth サインアップ (Email+Password)        │
│     └→ Email確認 OFF (管理者承認制のため)               │
│     └→ user_metadata に invite_code を保存             │
│                                                       │
│  ③ Auth Hook (after signup)                           │
│     └→ profiles INSERT (status='pending')              │
│     └→ invite_codes.is_used = true                     │
│     └→ invite_slots 初期化                             │
│     └→ notification_preferences 初期化                 │
│                                                       │
│  ④ 管理者が profiles.status を 'active' に変更        │
│     └→ ログイン時に status='active' をチェック          │
│                                                       │
│  ⑤ RLS で status='active' かつ rank ≥ required_rank   │
│     のコンテンツのみ返却                                │
└─────────────────────────────────────────────────────┘
```

### 2-2. 具体的フロー

**招待コード検証 (未認証でアクセス可能)**
```sql
-- Supabase RPC: verify_invite_code
create or replace function verify_invite_code(input_code text)
returns json as $$
declare
  invite record;
begin
  select * into invite from invite_codes
    where code = input_code
    and is_used = false
    and (expires_at is null or expires_at > now());

  if invite is null then
    return json_build_object('valid', false);
  end if;

  return json_build_object(
    'valid', true,
    'referrer_name', (select display_name from profiles where id = invite.created_by)
  );
end;
$$ language plpgsql security definer;
```

**サインアップ後のトリガー**
```sql
-- auth.users 作成後に profiles を自動作成
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name, email, screening_answer, invited_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    new.email,
    new.raw_user_meta_data->>'screening_answer',
    (select created_by from invite_codes
     where code = new.raw_user_meta_data->>'invite_code' limit 1)
  );

  -- 招待コードを使用済みに
  update invite_codes
    set is_used = true, used_by = new.id
    where code = new.raw_user_meta_data->>'invite_code';

  -- 招待枠を初期化
  insert into invite_slots (user_id) values (new.id);

  -- 通知設定を初期化
  insert into notification_preferences (user_id) values (new.id);

  -- 招待実績に登録完了を記録
  update referrals
    set referred_id = new.id, registered_at = now()
    where invite_code_id = (
      select id from invite_codes
      where code = new.raw_user_meta_data->>'invite_code' limit 1
    )
    and referred_id is null
    limit 1;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

**ログイン時のステータスチェック (Middleware)**
```
Next.js Middleware (middleware.ts)
  └→ Supabase getSession()
  └→ Session あり → profiles.status チェック
       ├→ 'active'    → 通過
       ├→ 'pending'   → /pending ページへリダイレクト
       └→ 'suspended' → /suspended ページへリダイレクト
  └→ Session なし → / (Gateway) へリダイレクト
       ※ /register と / は認証不要
```

### 2-3. rank ベースのコンテンツアクセス制御

| コンテンツの `required_rank` | 閲覧可能な `profiles.rank` |
|---|---|
| `standard` (= `all`) | standard, gold, platinum, diamond |
| `gold` | gold, platinum, diamond |
| `platinum` | platinum, diamond |
| `diamond` | diamond |

RLS ポリシーでの比較に使う enum 順序:
```sql
-- member_rank enum の順序: standard < gold < platinum < diamond
-- PostgreSQL の enum は定義順で比較可能
```

---

## 3. API / Server Actions 設計

### 3-1. 方針

| 層 | 技術 | 用途 |
|---|---|---|
| データ取得 (読み取り) | Supabase Client SDK (ブラウザ直接) | RLS で保護された SELECT |
| データ変更 (書き込み) | Next.js Server Actions | バリデーション + Supabase Admin SDK |
| 定期処理 | Vercel Cron (Edge Functions) | 予約公開・統計集計 |
| ファイルアップロード | Supabase Storage (署名付きURL) | サムネイル・動画 |

### 3-2. Server Actions 一覧

```
app/
├── actions/
│   ├── auth.ts                    # 認証関連
│   │   ├── verifyInviteCode()     # 招待コード検証 (RPC呼び出し)
│   │   ├── signUp()               # サインアップ (invite_code, email, password, profile)
│   │   ├── signIn()               # ログイン
│   │   ├── signOut()              # ログアウト
│   │   └── changePassword()       # パスワード変更
│   │
│   ├── profile.ts                 # プロフィール
│   │   ├── getProfile()           # 自分のプロフィール取得
│   │   ├── updateProfile()        # プロフィール更新
│   │   ├── updateAvatar()         # アバター画像アップロード
│   │   └── updateNotifications()  # 通知設定更新
│   │
│   ├── content.ts                 # コンテンツ
│   │   ├── getContents()          # 一覧取得 (ステータス・タイプでフィルタ)
│   │   ├── getContentById()       # 詳細取得 + 閲覧数インクリメント
│   │   ├── createContent()        # 新規作成 (admin)
│   │   ├── updateContent()        # 更新 (admin)
│   │   ├── deleteContent()        # 削除 (admin)
│   │   ├── toggleLike()           # いいね ON/OFF
│   │   └── toggleBookmark()       # ブックマーク ON/OFF
│   │
│   ├── referral.ts                # 招待・リファラル
│   │   ├── getReferralStats()     # 自分の招待統計 (clicks, registrations, conversion)
│   │   ├── getInviteSlots()       # 招待枠情報
│   │   ├── generateInviteCode()   # 新規招待コード発行
│   │   ├── trackClick()           # リファラルクリック記録
│   │   └── getUnlockConditions()  # 枠解放条件の進捗
│   │
│   ├── admin.ts                   # 管理者
│   │   ├── getDashboardStats()    # 統計情報 (集計クエリ)
│   │   ├── getGrowthData()        # 月別成長データ
│   │   ├── getWeeklyRegistrations() # 週間登録データ
│   │   ├── getUsers()             # ユーザー一覧
│   │   ├── updateUserStatus()     # ユーザー承認/停止
│   │   ├── getRewards()           # 特典一覧 + 達成者数
│   │   ├── createReward()         # 特典作成
│   │   ├── deleteReward()         # 特典削除
│   │   ├── sendBroadcast()        # 配信送信
│   │   └── getBroadcasts()        # 配信履歴
│   │
│   └── storage.ts                 # ファイルアップロード
│       ├── uploadThumbnail()      # サムネイル (リサイズ後アップロード)
│       └── getSignedUrl()         # 署名付きURL取得
```

### 3-3. 統計ダッシュボードのクエリ例

```sql
-- getDashboardStats() で使うクエリ群

-- 総登録者数
select count(*) as total_users from profiles where status = 'active';

-- アクティブ率 (過去30日にログインしたユーザー)
select
  round(
    count(distinct lh.user_id)::numeric /
    nullif((select count(*) from profiles where status = 'active'), 0) * 100,
    1
  ) as active_rate
from login_history lh
where lh.logged_in_at > now() - interval '30 days';

-- 今月の新規登録
select count(*) as monthly_new_users
from profiles
where created_at >= date_trunc('month', now());

-- 招待経由率
select
  round(
    count(case when invited_by is not null then 1 end)::numeric /
    nullif(count(*), 0) * 100,
    1
  ) as invite_conversion_rate
from profiles;

-- 月別成長データ (getGrowthData)
select
  to_char(created_at, 'MM月') as month,
  count(*) as total,
  count(case when invited_by is not null then 1 end) as invited
from profiles
where created_at >= now() - interval '7 months'
group by date_trunc('month', created_at), to_char(created_at, 'MM月')
order by date_trunc('month', created_at);

-- 週間登録データ (getWeeklyRegistrations)
select
  to_char(created_at, 'Dy') as day,
  count(*) as registrations
from profiles
where created_at >= date_trunc('week', now())
group by extract(dow from created_at), to_char(created_at, 'Dy')
order by extract(dow from created_at);
```

### 3-4. Vercel Cron Jobs (Edge Functions)

```
vercel.json:
{
  "crons": [
    {
      "path": "/api/cron/publish-scheduled",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

```typescript
// app/api/cron/publish-scheduled/route.ts
// 15分ごとに予約公開コンテンツの status を 'published' に変更
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Supabase Admin Client で予約コンテンツを公開
  const { data, error } = await supabaseAdmin
    .from('contents')
    .update({ status: 'published' })
    .eq('status', 'scheduled')
    .lte('publish_date', new Date().toISOString());

  return Response.json({ published: data?.length ?? 0 });
}
```

### 3-5. Zustand ストア改修方針

既存の Zustand ストアのインターフェース (メソッド名・返り値の型) は維持し、内部実装だけを差し替える。

```
変更前:  Zustand persist (localStorage)  →  コンポーネントが直接参照
変更後:  Zustand (メモリ)  ←  Server Actions / Supabase Client  ←  DB
```

**例: `useContentStore` の改修イメージ**

```typescript
// lib/store/use-content-store.ts (改修後)
export const useContentStore = create<ContentState>()((set, get) => ({
  contents: [],
  isLoading: false,

  // 初回ロード (Server Action 経由)
  fetchContents: async () => {
    set({ isLoading: true });
    const contents = await getContents();
    set({ contents, isLoading: false });
  },

  // インターフェース維持
  addContent: async (content) => {
    await createContent(content);
    get().fetchContents(); // 再取得
  },

  deleteContent: async (id) => {
    await deleteContentAction(id);
    set((state) => ({
      contents: state.contents.filter((c) => c.id !== id),
    }));
  },

  incrementViews: async (id) => {
    await recordView(id);
    // Optimistic update
    set((state) => ({
      contents: state.contents.map((c) =>
        c.id === id ? { ...c, views: c.views + 1 } : c
      ),
    }));
  },
}));
```

---

## 4. Supabase Storage 設計

### 4-1. バケット構成

| バケット | 用途 | 公開設定 | ファイルサイズ上限 |
|---|---|---|---|
| `avatars` | ユーザーアバター | public | 2 MB |
| `thumbnails` | コンテンツサムネイル | public | 5 MB |
| `content-media` | 動画・記事内画像 | private (署名付きURL) | 50 MB |

### 4-2. Storage ポリシー

```sql
-- avatars: 本人のみアップロード、全員閲覧可
create policy "Avatar upload" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Avatar public read" on storage.objects
  for select using (bucket_id = 'avatars');

-- thumbnails: admin のみアップロード、全員閲覧可
create policy "Thumbnail upload" on storage.objects
  for insert with check (
    bucket_id = 'thumbnails'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Thumbnail public read" on storage.objects
  for select using (bucket_id = 'thumbnails');
```

---

## 5. 無料枠内での運用アドバイス

### 5-1. 各サービスの無料枠上限

| サービス | リソース | 無料枠 | 想定使用量 (〜1000ユーザー) |
|---|---|---|---|
| **Supabase DB** | ストレージ | 500 MB | テキストデータ: ~10 MB |
| **Supabase Auth** | MAU | 50,000 | ~1,000 |
| **Supabase Storage** | 容量 | 1 GB | 画像最適化後: ~200 MB |
| **Supabase API** | リクエスト | 無制限 (帯域制限あり) | — |
| **Supabase Edge Functions** | 呼び出し | 500K/月 | ~50K |
| **Vercel** | 帯域 | 100 GB/月 | ~10 GB |
| **Vercel Serverless** | 呼び出し | 100K/月 | ~30K |
| **Vercel Cron** | ジョブ | 2 (日次) → Hobby は制限あり | 1 |

### 5-2. ストレージ節約戦略

**画像最適化 (最重要)**

```typescript
// アップロード前にクライアントサイドでリサイズ
// lib/utils/image.ts
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await new Promise(r => img.onload = r);

  const ratio = Math.min(maxWidth / img.width, 1);
  canvas.width = img.width * ratio;
  canvas.height = img.height * ratio;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise(resolve =>
    canvas.toBlob(blob => resolve(blob!), 'image/webp', quality)
  );
}
```

| 画像種類 | リサイズ上限 | フォーマット | 目標サイズ |
|---|---|---|---|
| サムネイル | 1200×675px (16:9) | WebP | < 100 KB |
| アバター | 200×200px | WebP | < 30 KB |
| 記事内画像 | 1200px幅 | WebP | < 200 KB |

**動画は外部ホスティング推奨:**
- YouTube (限定公開) または Vimeo に動画をホストし、`url` フィールドに埋め込みURLを保存
- Supabase Storage の 1 GB 枠を動画で消費しない

### 5-3. API コール節約

| 手法 | 詳細 |
|---|---|
| **SWR / React Query によるキャッシュ** | `staleTime: 5min` で不要な再取得を防止 |
| **Optimistic Updates** | いいね・ブックマークは即座にUIに反映し、バックグラウンドで DB 更新 |
| **バッチ閲覧記録** | `incrementViews` は即時呼び出しせず、ページ離脱時にまとめて送信 |
| **静的ページ生成** | 公開済み記事は ISR (revalidate: 3600) で CDN キャッシュ |
| **DB コネクション** | Supabase Client SDK のコネクションプーリングを使用 (Supavisor) |

### 5-4. Vercel Cron の制約回避

Vercel Hobby プランでは Cron ジョブは **日次1回** に制限される。予約公開を高頻度で行う場合:

- **代替案A:** クライアントサイドで `publish_date <= now()` のコンテンツを表示対象に含める (DBステータスは `scheduled` のまま)
- **代替案B:** Supabase の `pg_cron` 拡張を使用 (無料枠で利用可)

```sql
-- Supabase Dashboard → SQL Editor で実行
select cron.schedule(
  'publish-scheduled-content',
  '*/15 * * * *',
  $$
    update contents
    set status = 'published'
    where status = 'scheduled'
    and publish_date <= now();
  $$
);
```

### 5-5. 無料枠を超えないためのモニタリング

```
Supabase Dashboard → Settings → Usage
  ├── Database size: 500 MB 上限に対する現在値
  ├── Storage size: 1 GB 上限に対する現在値
  └── Auth users: MAU 確認

Vercel Dashboard → Usage
  ├── Bandwidth: 100 GB 上限
  └── Function invocations: 100K 上限
```

**アラート設定:**
- Supabase: Database 使用量が 400 MB を超えたら古い `login_history` / `content_interactions(view)` を定期削除
- 画像: 総容量が 800 MB を超えたら古いサムネイルの解像度を下げて再保存

### 5-6. スケーリング指標

| ユーザー数 | 無料枠で運用可能か | ボトルネック |
|---|---|---|
| ~500 | 余裕あり | — |
| ~1,000 | 可能 | Storage が 1 GB に近づく可能性 |
| ~5,000 | 要検討 | Auth MAU は余裕だが Storage・帯域超過の恐れ |
| ~10,000+ | Pro プラン推奨 | — |

---

## 6. 環境変数

```env
# .env.local (Vercel にも設定)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # Server Actions 専用
CRON_SECRET=random-secret-for-cron        # Cron 認証用
```

---

## 7. 実装優先順位

| Phase | 内容 | 推定工数 |
|---|---|---|
| **Phase 1** | Supabase プロジェクト作成 + マイグレーション実行 + Auth 設定 | 0.5日 |
| **Phase 2** | 認証フロー (Gateway → 招待コード検証 → サインアップ → ログイン) + Middleware | 1日 |
| **Phase 3** | `contents` CRUD + Storage (サムネイル) + フィード表示 | 1日 |
| **Phase 4** | 記事詳細 (閲覧数・いいね・ブックマーク) + コンテンツアクセス制御 | 0.5日 |
| **Phase 5** | マイページ (リファラル統計・招待枠・招待コード発行) | 1日 |
| **Phase 6** | 管理者ダッシュボード (統計・ユーザー管理・特典・配信) | 1日 |
| **Phase 7** | 設定ページ (プロフィール更新・パスワード変更・通知設定) | 0.5日 |
| **Phase 8** | Cron (予約公開) + パフォーマンス最適化 (ISR, SWR) | 0.5日 |
