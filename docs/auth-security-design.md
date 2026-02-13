# TheJapanLocalMedia 会員登録・認証機能 詳細設計書

> セキュリティと運用管理を重視した、クローズドメディア向け認証基盤の設計

---

## 1. 全体アーキテクチャ

```
┌──────────────────────────────────────────────────────────────┐
│                        クライアント (既存UI)                    │
│                                                                │
│  app/page.tsx          app/register/page.tsx                   │
│  ┌──────────────┐      ┌──────────────────┐                   │
│  │ 招待コード入力  │      │ 登録フォーム        │                   │
│  │ → ログイン     │      │ (姓名/Email/PW/   │                   │
│  │   (Email+PW)  │      │  審査項目)         │                   │
│  └──────┬───────┘      └────────┬─────────┘                   │
│         │                       │                               │
│    Zod バリデーション          Zod バリデーション                    │
│         │                       │                               │
└─────────┼───────────────────────┼───────────────────────────────┘
          │                       │
          ▼                       ▼
┌──────────────────────────────────────────────────────────────┐
│                  Server Actions (Vercel)                       │
│                                                                │
│  actions/auth.ts                                               │
│  ├── verifyInviteCode()    招待コード検証 (RPC)                  │
│  ├── signUp()              サインアップ + メール確認送信           │
│  ├── signIn()              ログイン + ステータスチェック            │
│  ├── signOut()             ログアウト                            │
│  └── changePassword()      パスワード変更                        │
│                                                                │
│  middleware.ts             セッション検証 + リダイレクト制御        │
└──────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────┐
│                     Supabase                                   │
│                                                                │
│  Auth      ← Email/Password 認証 + メール確認                   │
│  Database  ← profiles + invite_codes + RLS                     │
│  RPC       ← verify_invite_code()                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Zod バリデーションスキーマ

### 2-1. 共通定義

```typescript
// lib/validations/auth.ts
import { z } from "zod"

// ──────── パスワード複雑性ルール ────────
// 既存UIの要件: "8文字以上" (register/page.tsx minLength={8})
// セキュリティ強化: 英数字混合 + 記号推奨
export const passwordSchema = z
  .string()
  .min(8, "パスワードは8文字以上で入力してください")
  .max(72, "パスワードは72文字以下で入力してください")    // bcrypt 制限
  .regex(/[a-zA-Z]/, "英字を1文字以上含めてください")
  .regex(/[0-9]/, "数字を1文字以上含めてください")
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    "記号を1文字以上含めてください"
  )

// ──────── メールアドレス ────────
export const emailSchema = z
  .string()
  .min(1, "メールアドレスを入力してください")
  .email("有効なメールアドレスを入力してください")
  .max(254, "メールアドレスが長すぎます")
  .transform((v) => v.toLowerCase().trim())

// ──────── 招待コード ────────
export const inviteCodeSchema = z
  .string()
  .min(1, "招待コードを入力してください")
  .regex(
    /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
    "招待コードの形式が正しくありません (XXXX-XXXX-XXXX)"
  )
```

### 2-2. 登録フォームスキーマ

```typescript
// lib/validations/auth.ts (続き)

// 既存UI: register/page.tsx の formData 構造に合致
export const signUpSchema = z.object({
  lastName: z
    .string()
    .min(1, "姓を入力してください")
    .max(50, "姓は50文字以下で入力してください"),
  firstName: z
    .string()
    .min(1, "名を入力してください")
    .max(50, "名は50文字以下で入力してください"),
  email: emailSchema,
  password: passwordSchema,
  question: z
    .string()
    .min(10, "審査項目は10文字以上で入力してください")
    .max(1000, "審査項目は1000文字以下で入力してください"),
  inviteCode: inviteCodeSchema,
})

export type SignUpInput = z.infer<typeof signUpSchema>
```

### 2-3. ログインフォームスキーマ

```typescript
// lib/validations/auth.ts (続き)

// 既存UI: page.tsx (Gateway) の login フォームに合致
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "パスワードを入力してください"),
})

export type SignInInput = z.infer<typeof signInSchema>
```

### 2-4. パスワード変更スキーマ

```typescript
// lib/validations/auth.ts (続き)

// 既存UI: settings/page.tsx の Security タブに合致
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "確認用パスワードを入力してください"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "新しいパスワードが一致しません",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "現在のパスワードと異なるパスワードを設定してください",
    path: ["newPassword"],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
```

### 2-5. プロフィール更新スキーマ

```typescript
// lib/validations/profile.ts

import { z } from "zod"

// 既存UI: settings/page.tsx の Profile タブに合致
export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "表示名を入力してください")
    .max(100),
  email: z.string().email().optional(),
  phone: z
    .string()
    .regex(/^[\d\-+()]*$/, "有効な電話番号を入力してください")
    .optional()
    .or(z.literal("")),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
```

---

## 3. メールアドレス実在確認 (Email Verification) フロー

### 3-1. Supabase Auth 設定

```
Supabase Dashboard → Authentication → Email Templates:

  Confirm Signup テンプレート:
  ┌──────────────────────────────────────────────────┐
  │ 件名: 【TheJapanLocalMedia】メールアドレスの確認               │
  │                                                    │
  │ {{ .DisplayName }} 様                              │
  │                                                    │
  │ TheJapanLocalMediaへの登録申請ありがとうございます。              │
  │ 以下のリンクをクリックして、メールアドレスの           │
  │ 確認を完了してください。                             │
  │                                                    │
  │ [メールアドレスを確認する]({{ .ConfirmationURL }})   │
  │                                                    │
  │ ※ このリンクの有効期限は24時間です。                 │
  │ ※ 確認完了後、管理者による審査を行います。           │
  │   審査完了後にログインが可能になります。              │
  └──────────────────────────────────────────────────┘

  設定:
  - Enable email confirmations: ON
  - Confirm email change: ON
  - Mailer OTP expiration: 86400 (24時間)
  - Rate limit (emails/hour): 4
```

### 3-2. フロー全体図

```
ユーザー                   Server Action              Supabase Auth          Database
  │                          │                          │                      │
  │── 登録フォーム送信 ──────→│                          │                      │
  │                          │── Zod バリデーション ──→ OK│                      │
  │                          │── 招待コード検証 ─────────│──── RPC ────────────→│
  │                          │                          │                      │← 有効
  │                          │── signUp() ──────────────→│                      │
  │                          │                          │── 確認メール送信       │
  │                          │                          │── auth.users 作成     │
  │                          │                          │   (email_confirmed    │
  │                          │                          │    = false)           │
  │                          │                          │                      │
  │                          │                          │──── Trigger ────────→│
  │                          │                          │                      │── profiles 作成
  │                          │                          │                      │   (status='pending')
  │                          │                          │                      │── invite_codes 使用済み
  │                          │                          │                      │── invite_slots 初期化
  │←─ 登録完了画面 ──────────│                          │                      │
  │  「審査完了後メールで      │                          │                      │
  │   お知らせします」         │                          │                      │
  │                          │                          │                      │
  │── メール内リンクをクリック ─│                          │                      │
  │                          │                          │── email_confirmed    │
  │                          │                          │   = true             │
  │                          │                          │                      │
  │                          │      【管理者が承認】       │                      │
  │                          │                          │                      │── profiles.status
  │                          │                          │                      │   = 'active'
  │                          │                          │                      │
  │── ログイン ──────────────→│                          │                      │
  │                          │── signInWithPassword ────→│                      │
  │                          │── email_confirmed? ──────→│ true ✓              │
  │                          │── profiles.status? ───────│──────────────────→  │ 'active' ✓
  │←─ /feed へリダイレクト ──│                          │                      │
```

### 3-3. Server Actions 実装

```typescript
// app/actions/auth.ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { signUpSchema, signInSchema, type SignUpInput, type SignInInput } from "@/lib/validations/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

// ──────── 招待コード検証 ────────
export async function verifyInviteCode(code: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("verify_invite_code", {
    input_code: code,
  })

  if (error) return { valid: false, error: "検証中にエラーが発生しました" }
  return data as { valid: boolean; referrer_name?: string }
}

// ──────── サインアップ ────────
export async function signUp(input: SignUpInput) {
  // 1. Zod バリデーション (サーバーサイド)
  const parsed = signUpSchema.safeParse(input)
  if (!parsed.success) {
    return {
      error: parsed.error.errors[0].message,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { lastName, firstName, email, password, question, inviteCode } = parsed.data

  // 2. 招待コード再検証 (TOCTOU 対策)
  const codeCheck = await verifyInviteCode(inviteCode)
  if (!codeCheck.valid) {
    return { error: "招待コードが無効または使用済みです" }
  }

  // 3. Supabase Auth サインアップ
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: `${lastName} ${firstName}`,
        screening_answer: question,
        invite_code: inviteCode,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "このメールアドレスは既に登録されています" }
    }
    return { error: "登録中にエラーが発生しました" }
  }

  return { success: true }
}

// ──────── ログイン ────────
export async function signIn(input: SignInInput) {
  // 1. Zod バリデーション
  const parsed = signInSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()

  // 2. Supabase Auth ログイン
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // レート制限チェック
    if (error.status === 429) {
      return { error: "ログイン試行回数が上限に達しました。しばらく待ってからお試しください" }
    }
    return { error: "メールアドレスまたはパスワードが正しくありません" }
  }

  // 3. メール確認チェック
  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut()
    return { error: "メールアドレスの確認が完了していません。受信メールをご確認ください" }
  }

  // 4. プロフィールステータスチェック
  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", data.user.id)
    .single()

  if (!profile || profile.status === "pending") {
    await supabase.auth.signOut()
    return { error: "アカウントは現在審査中です。承認後にログインいただけます" }
  }

  if (profile.status === "suspended") {
    await supabase.auth.signOut()
    return { error: "アカウントが停止されています。管理者にお問い合わせください" }
  }

  // 5. ログイン履歴記録
  await supabase.from("login_history").insert({
    user_id: data.user.id,
    device: null,       // middleware または client で取得
    ip_address: null,   // Vercel の headers から取得
  })

  revalidatePath("/", "layout")
  redirect("/feed")
}

// ──────── ログアウト ────────
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

// ──────── パスワード変更 ────────
export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  const supabase = await createClient()

  // 現在のパスワードで再認証
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: "ユーザー情報を取得できません" }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (verifyError) {
    return { error: "現在のパスワードが正しくありません" }
  }

  // パスワード更新
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) return { error: "パスワードの更新に失敗しました" }
  return { success: true }
}
```

---

## 4. クローズドメディア対応: アクセス制御設計

### 4-1. 登録制限の仕組み (3段階ゲート)

```
第1ゲート: 招待コード ──→ 有効なコードがなければ登録不可
    │
    ▼
第2ゲート: メール確認 ──→ メールアドレスの実在性を担保
    │
    ▼
第3ゲート: 管理者承認 ──→ profiles.status = 'active' でなければログイン不可
```

### 4-2. 招待コード生成ロジック

```typescript
// lib/utils/invite.ts

/**
 * XXXX-XXXX-XXXX 形式の招待コードを生成
 * 文字セット: A-Z, 0-9 (紛らわしい文字を除外: 0/O, 1/I/L)
 */
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

export function generateInviteCode(): string {
  const segment = () =>
    Array.from(
      crypto.getRandomValues(new Uint8Array(4)),
      (b) => CHARSET[b % CHARSET.length]
    ).join("")

  return `${segment()}-${segment()}-${segment()}`
}
```

### 4-3. 招待コード検証 RPC

```sql
-- Supabase RPC (匿名アクセス可能 = security definer)
create or replace function verify_invite_code(input_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_record record;
  referrer_name text;
begin
  -- コード存在 & 未使用 & 未失効 をチェック
  select ic.*, p.display_name as ref_name
  into invite_record
  from invite_codes ic
  join profiles p on p.id = ic.created_by
  where ic.code = upper(input_code)     -- 大文字に正規化
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

-- 匿名ユーザーから呼び出し可能にする
grant execute on function verify_invite_code(text) to anon;
```

### 4-4. 追加のホワイトリスト方式 (オプション)

特定ドメインのメールアドレスのみ許可する場合:

```sql
-- ドメイン制限テーブル
create table allowed_email_domains (
  id      uuid primary key default gen_random_uuid(),
  domain  text unique not null      -- 例: "company.co.jp"
);

-- サインアップ前のチェック (Server Action 内)
-- signUp() に以下を追加:
-- const domain = email.split("@")[1]
-- const { data } = await supabase
--   .from("allowed_email_domains")
--   .select("domain")
--   .eq("domain", domain)
--   .single()
-- if (!data) return { error: "このメールアドレスでは登録できません" }
```

現時点では**招待コード制のみで運用**し、ドメイン制限は必要に応じて追加する方針を推奨。

---

## 5. profiles テーブル設計 (auth.users 連携)

### 5-1. テーブル定義 (再掲 + 詳細)

```sql
create type member_rank as enum ('standard', 'gold', 'platinum', 'diamond');
create type user_role as enum ('member', 'admin');
create type user_status as enum ('pending', 'active', 'suspended');

create table profiles (
  -- ──── auth.users との 1:1 連携 ────
  id              uuid primary key references auth.users(id) on delete cascade,

  -- ──── 基本情報 (register/page.tsx に対応) ────
  member_id       text unique not null,           -- "JK-00247" (自動採番)
  display_name    text not null,                   -- 姓 + 名
  email           text not null,                   -- auth.users.email と同期

  -- ──── プロフィール (settings/page.tsx に対応) ────
  phone           text,                            -- "090-1234-5678"
  bio             text,                            -- 自己紹介
  location        text,                            -- "東京都渋谷区"
  company         text,                            -- "株式会社サンプル"
  position        text,                            -- "マーケティング部長"
  avatar_url      text,                            -- Storage URL

  -- ──── 権限・ステータス ────
  rank            member_rank not null default 'standard',
  role            user_role not null default 'member',
  status          user_status not null default 'pending',

  -- ──── 審査・招待 ────
  screening_answer text,                           -- 登録時の審査回答
  invited_by       uuid references profiles(id),  -- 紹介者

  -- ──── タイムスタンプ ────
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
```

### 5-2. auth.users → profiles 自動同期

```sql
-- サインアップ時に profiles を自動作成
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
  where code = new.raw_user_meta_data->>'invite_code'
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

  -- 招待枠を初期化 (初期2枠)
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
  update referrals
  set referred_id = new.id, registered_at = now()
  where invite_code_id = invite_code_record.id
    and referred_id is null;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

### 5-3. profiles フィールドと既存 UI の対応表

| profiles カラム | 既存UI での表示箇所 | 既存コード参照 |
|---|---|---|
| `display_name` | AppHeader (ユーザーメニュー), MyPage ("田中 太郎"), Settings | `useUserStore().user.name` |
| `email` | AppHeader, Settings | `useUserStore().user.email` |
| `member_id` | AppHeader ("JK-00247"), MyPage, Settings | `useUserStore().user.memberId` |
| `rank` | Settings ("会員ランク: スタンダード") | `useUserStore().user.rank` |
| `phone` | Settings (プロフィール) | `profile.phone` (ローカル state) |
| `bio` | Settings (プロフィール) | `profile.bio` (ローカル state) |
| `location` | Settings (プロフィール) | `profile.location` (ローカル state) |
| `company` | Settings (プロフィール) | `profile.company` (ローカル state) |
| `position` | Settings (プロフィール) | `profile.position` (ローカル state) |
| `avatar_url` | Settings (アバター), AppHeader | UIに初期値アイコンあり |
| `screening_answer` | Register (審査項目) | `formData.question` |
| `status` | Admin Users (承認済み/承認待ち) | `AdminUser.status` |

---

## 6. ロールベースのコンテンツ表示制御

### 6-1. 権限マトリクス

```
                    ┌───────────────────────────────────────────┐
                    │           コンテンツの required_rank        │
                    ├──────────┬────────┬──────────┬────────────┤
                    │ standard │  gold  │ platinum │  diamond   │
                    │ (= all)  │        │          │            │
┌───────┬──────────┼──────────┼────────┼──────────┼────────────┤
│       │ standard │    ✓     │   🔒   │    🔒    │     🔒     │
│ユーザー│   gold   │    ✓     │   ✓    │    🔒    │     🔒     │
│のrank │ platinum │    ✓     │   ✓    │    ✓     │     🔒     │
│       │ diamond  │    ✓     │   ✓    │    ✓     │     ✓      │
└───────┴──────────┴──────────┴────────┴──────────┴────────────┘

✓ = 閲覧可能    🔒 = ロックアイコン + アップグレード案内を表示
```

### 6-2. RLS による DB レベルの制御

```sql
-- contents の閲覧ポリシー
create policy "rank_based_content_access" on contents
  for select using (
    -- 非プレミアムコンテンツは全員閲覧可
    (premium = false and status = 'published')
    or
    -- プレミアムコンテンツはランク比較
    (
      premium = true
      and status = 'published'
      and required_rank <= (
        select rank from profiles where id = auth.uid()
      )
    )
    or
    -- 管理者は全コンテンツ閲覧可
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );
```

### 6-3. フロントエンド側の表示ロジック (既存UI維持)

既存のフィード表示ロジック (`feed/page.tsx`) を維持しつつ、ロック表示を追加:

```typescript
// lib/hooks/use-content-access.ts
import { useUserStore } from "@/lib/store/use-user-store"

const RANK_ORDER: Record<string, number> = {
  standard: 1,
  gold: 2,
  platinum: 3,
  diamond: 4,
}

export function useContentAccess() {
  const { user } = useUserStore()

  const canAccess = (requiredRank: string): boolean => {
    if (!user) return false
    const userLevel = RANK_ORDER[user.rank] ?? 0
    const requiredLevel = RANK_ORDER[requiredRank] ?? 0
    return userLevel >= requiredLevel
  }

  return { canAccess }
}
```

既存UIでは既に `{item.premium && <Lock />}` バッジが表示されており、
バックエンド接続後は **RLS でフィルタされたコンテンツ + クライアントのロック表示** の2重制御になる。

### 6-4. admin ロールの制御

```typescript
// middleware.ts での admin ルート保護
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* ... */)
  const { data: { session } } = await supabase.auth.getSession()

  // 未認証 → Gateway へ
  const publicPaths = ["/", "/register", "/auth/callback"]
  if (!session && !publicPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // /admin ルートは admin ロールのみ
  if (request.nextUrl.pathname.startsWith("/admin") && session) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", session.user.id)
      .single()

    if (profile?.role !== "admin" || profile?.status !== "active") {
      return NextResponse.redirect(new URL("/feed", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
}
```

---

## 7. 管理画面のユーザー管理 DB 設計

### 7-1. 管理者が行える操作

| 操作 | 対象テーブル | 対象カラム | 既存UI参照 |
|---|---|---|---|
| ユーザー一覧表示 | `profiles` | 全カラム | `admin-users.tsx` |
| ステータス変更 (承認/停止) | `profiles` | `status` | `updateUserStatus()` |
| ランク変更 | `profiles` | `rank` | 現UIになし → 拡張可能 |
| ロール変更 (member↔admin) | `profiles` | `role` | 現UIになし → 拡張可能 |
| アカウント削除 | `auth.users` (CASCADE → profiles) | — | settings の「アカウント削除」 |

### 7-2. 管理者用 Server Actions

```typescript
// app/actions/admin.ts
"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/auth/guards"

// ──── 管理者権限チェック共通関数 ────
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") throw new Error("Forbidden")
  return user
}

// ──── ユーザー一覧取得 ────
export async function getUsers(options?: {
  search?: string
  sortBy?: "referrals" | "clicks" | "registrations"
}) {
  await requireAdmin()
  const supabaseAdmin = createAdminClient()

  // profiles + 招待実績の集計を結合
  const { data } = await supabaseAdmin
    .from("profiles")
    .select(`
      id, display_name, email, status, rank, role, created_at,
      referrals:referrals!referrals_referrer_id_fkey(count),
      invite_codes:invite_codes!invite_codes_created_by_fkey(
        referrals:referrals!referrals_invite_code_id_fkey(count)
      )
    `)
    .order("created_at", { ascending: false })

  return data
}

// ──── ユーザーステータス更新 ────
export async function updateUserStatus(
  userId: string,
  newStatus: "active" | "pending" | "suspended"
) {
  await requireAdmin()
  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ status: newStatus })
    .eq("id", userId)

  if (error) throw new Error("ステータス更新に失敗しました")

  revalidatePath("/admin")
  return { success: true }
}

// ──── ユーザーランク変更 ────
export async function updateUserRank(
  userId: string,
  newRank: "standard" | "gold" | "platinum" | "diamond"
) {
  await requireAdmin()
  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ rank: newRank })
    .eq("id", userId)

  if (error) throw new Error("ランク更新に失敗しました")
  return { success: true }
}

// ──── ユーザーロール変更 ────
export async function updateUserRole(
  userId: string,
  newRole: "member" | "admin"
) {
  await requireAdmin()
  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId)

  if (error) throw new Error("ロール更新に失敗しました")
  return { success: true }
}

// ──── アカウント削除 (admin による強制削除) ────
export async function deleteUser(userId: string) {
  await requireAdmin()
  const supabaseAdmin = createAdminClient()

  // auth.users を削除 → CASCADE で profiles も削除
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) throw new Error("アカウント削除に失敗しました")

  revalidatePath("/admin")
  return { success: true }
}
```

### 7-3. 管理者用ビュー (集計クエリの最適化)

```sql
-- admin-users.tsx で表示する集計データ用ビュー
create or replace view admin_user_stats as
select
  p.id,
  p.display_name as name,
  p.email,
  p.status,
  p.rank,
  p.role,
  p.created_at as join_date,
  -- 紹介数 (registered_at が NOT NULL = 登録完了)
  coalesce(r.referral_count, 0) as referrals,
  -- クリック数 (referrals テーブルの行数)
  coalesce(r.click_count, 0) as clicks,
  -- 登録完了数
  coalesce(r.registration_count, 0) as registrations
from profiles p
left join lateral (
  select
    count(*) as click_count,
    count(referred_id) as registration_count,
    count(referred_id) as referral_count
  from referrals
  where referrer_id = p.id
) r on true;

-- RLS: admin のみアクセス可能
-- (ビューは基底テーブルの RLS に従うため、profiles の admin ポリシーで制御)
```

---

## 8. 既存UIへの統合実装計画

### 8-1. 変更対象ファイルと変更内容

UIのレイアウト・スタイリングは一切変更しない。変更はロジック層のみ。

| ファイル | 変更内容 |
|---|---|
| **新規作成** | |
| `lib/supabase/client.ts` | ブラウザ用 Supabase Client 初期化 |
| `lib/supabase/server.ts` | Server Action 用 Supabase Client 初期化 |
| `lib/supabase/admin.ts` | Service Role Key を使う Admin Client |
| `lib/supabase/middleware.ts` | Middleware 用 Supabase Client |
| `lib/validations/auth.ts` | Zod スキーマ (本ドキュメント §2) |
| `lib/validations/profile.ts` | プロフィール用 Zod スキーマ |
| `app/actions/auth.ts` | 認証 Server Actions |
| `app/actions/profile.ts` | プロフィール Server Actions |
| `app/actions/admin.ts` | 管理者 Server Actions |
| `app/auth/callback/route.ts` | メール確認コールバック |
| `middleware.ts` | 認証・ルーティングガード |
| **変更** | |
| `app/page.tsx` | `handleInviteSubmit` → `verifyInviteCode()` 呼び出し |
| | `handleLoginSubmit` → `signIn()` 呼び出し |
| | エラー表示の追加 (既存UIスタイルで) |
| `app/register/page.tsx` | `handleSubmit` → `signUp()` 呼び出し |
| | `referrer` → `verifyInviteCode` から取得 |
| | バリデーションエラー表示の追加 |
| `app/settings/page.tsx` | Profile タブ → `updateProfile()` |
| | Security タブ → `changePassword()` |
| | Notifications タブ → `updateNotifications()` |
| | ログイン履歴 → DB から取得 |
| `lib/store/use-user-store.ts` | localStorage persist → Supabase 連携 |
| `lib/store/use-content-store.ts` | localStorage persist → Server Actions 経由 |
| `lib/store/use-admin-store.ts` | localStorage persist → DB 集計クエリ |
| `lib/store/use-admin-user-store.ts` | localStorage persist → admin_user_stats ビュー |
| `lib/store/use-broadcast-store.ts` | localStorage persist → broadcasts テーブル |
| `lib/store/use-reward-store.ts` | localStorage persist → rewards テーブル |
| `components/app-header.tsx` | `useUserStore` は維持 (ストア内部が変わるだけ) |

### 8-2. 既存 UI コード変更例

**app/page.tsx (Gateway) — ロジック部分のみ変更:**

```typescript
// 変更前
const handleInviteSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  setIsValidating(true)
  setTimeout(() => {
    setIsValidating(false)
    setMode("login")
  }, 1200)
}

// 変更後
const [error, setError] = useState("")

const handleInviteSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsValidating(true)
  setError("")

  const result = await verifyInviteCode(inviteCode)
  setIsValidating(false)

  if (result.valid) {
    setMode("login")
  } else {
    setError("招待コードが無効です")
  }
}

const handleLoginSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError("")

  const result = await signIn({ email, password })
  if (result?.error) {
    setError(result.error)
  }
  // 成功時は signIn() 内で redirect("/feed") が実行される
}
```

エラーメッセージの表示は既存の `<p className="text-center text-xs text-[#F8F9FA]/30">` と同じスタイルで、色を `text-red-400` に変更するだけ。

### 8-3. Auth Callback Route (メール確認後のリダイレクト)

```typescript
// app/auth/callback/route.ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) =>
            cookies.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            ),
        },
      }
    )

    await supabase.auth.exchangeCodeForSession(code)
  }

  // メール確認完了 → "審査待ち" ページ or トップへ
  return NextResponse.redirect(`${origin}/`)
}
```

### 8-4. セキュリティチェックリスト

| 項目 | 対策 |
|---|---|
| パスワード総当たり | Supabase Auth のレート制限 (デフォルト有効) |
| CSRF | Server Actions は Next.js が自動対策 |
| XSS | React の自動エスケープ + Content-Security-Policy |
| SQL Injection | Supabase Client SDK のパラメータバインディング |
| 権限昇格 | RLS + Server Action 内の `requireAdmin()` チェック |
| セッションハイジャック | Supabase の HttpOnly / Secure Cookie |
| 招待コード総当たり | コード空間 29^12 ≈ 1.7×10^17 + レート制限 |
| TOCTOU (招待コード) | `signUp()` 内でコード再検証 + DB の UNIQUE 制約 |
| パスワードリスト攻撃 | 複雑性要件 (英数字+記号) + ログイン試行制限 |
