"use server"

import { createClient } from "@/lib/supabase/server"
import {
  signUpSchema,
  signInSchema,
  changePasswordSchema,
  passwordSchema,
  emailSchema,
  refCodeSchema,
  type SignUpInput,
  type SignInInput,
  type ChangePasswordInput,
} from "@/lib/validations/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"

// ──────── 招待コード検証 ────────
export async function verifyInviteCode(code: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("verify_invite_code", {
    input_code: code,
  })

  if (error) {
    return { valid: false as const, error: "検証中にエラーが発生しました" }
  }

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

  const { lastName, firstName, email, password, question, ref } =
    parsed.data

  // 2. 招待コード再検証 (TOCTOU 対策)
  const codeCheck = await verifyInviteCode(ref)
  if (!codeCheck.valid) {
    return { error: "招待リンクが無効です" }
  }

  // 3. Supabase Auth サインアップ
  const supabase = await createClient()

  // 既存セッションを明示的にクリア（ログイン中ユーザーが別アカウントで登録する際の干渉を防止）
  await supabase.auth.signOut()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: `${lastName} ${firstName}`,
        screening_answer: question,
        invite_code: ref,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    console.error("[signUp] Supabase auth error:", error.message, error.status)
    if (error.message.includes("already registered")) {
      return { error: "このメールアドレスは既に登録されています" }
    }
    if (error.message.includes("password")) {
      return { error: "パスワードは8文字以上で、英字と数字を含めてください" }
    }
    if (error.status === 429) {
      return { error: "登録の試行回数が上限に達しました。しばらく待ってからお試しください" }
    }
    if (error.message.includes("email")) {
      return { error: "メールアドレスに問題があります。別のアドレスをお試しください" }
    }
    return { error: `登録中にエラーが発生しました（${error.message}）` }
  }

  // Supabase がユーザーを作成したが identities が空の場合（既存メールの再登録試行）
  if (data?.user && data.user.identities?.length === 0) {
    return { error: "このメールアドレスは既に登録されています" }
  }

  return { success: true }
}

// ──────── ログイン ────────
export async function signIn(input: SignInInput) {
  const parsed = signInSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()

  // 既存セッションを明示的にクリア（別アカウントへの切替時にセッション競合を防止）
  await supabase.auth.signOut()

  // Supabase Auth ログイン
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    if (error.status === 429) {
      return {
        error:
          "ログイン試行回数が上限に達しました。しばらく待ってからお試しください",
      }
    }
    return { error: "メールアドレスまたはパスワードが正しくありません" }
  }

  // メール確認チェック
  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut()
    return {
      error:
        "メールアドレスの確認が完了していません。受信メールをご確認ください",
    }
  }

  // プロフィールステータスチェック
  const { data: profile } = await supabase
    .from("profiles")
    .select("status, role")
    .eq("id", data.user.id)
    .single()

  if (!profile || profile.status === "pending") {
    await supabase.auth.signOut()
    return {
      error: "アカウントは現在審査中です。承認後にログインいただけます",
    }
  }

  if (profile.status === "suspended") {
    await supabase.auth.signOut()
    return {
      error: "アカウントが停止されています。管理者にお問い合わせください",
    }
  }

  // ログイン履歴記録
  await supabase.from("login_history").insert({
    user_id: data.user.id,
  })

  revalidatePath("/", "layout")
  redirect(profile.role === "admin" ? "/admin" : "/feed")
}

// ──────── ログアウト ────────
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

// ──────── パスワードリセット要求 ────────
export async function requestPasswordReset(email: string) {
  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  // アカウント存在チェック（admin client で RLS を迂回）
  const admin = createAdminClient()
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("email", parsed.data)

  if (!count || count === 0) {
    return { error: "このメールアドレスで登録されたアカウントが見つかりません" }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-callback`,
  })

  if (error) {
    return { error: "リセットメールの送信に失敗しました。しばらく経ってからお試しください" }
  }

  return { success: true }
}

// ──────── 審査質問送信（OAuth 新規登録後） ────────
export async function submitScreeningAnswer(answer: string) {
  if (!answer || answer.trim().length === 0) {
    return { error: "審査質問への回答を入力してください" }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "認証されていません" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ screening_answer: answer.trim() })
    .eq("id", user.id)

  if (error) {
    return { error: "送信中にエラーが発生しました" }
  }

  await supabase.auth.signOut()

  return { success: true }
}

// ──────── パスワード再設定（リセットリンク経由） ────────
export async function resetPassword(newPassword: string) {
  const parsed = passwordSchema.safeParse(newPassword)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()

  // リセットリンクで認証済みセッションが必要
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { error: "セッションが無効です。リセットリンクを再度お試しください" }
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data,
  })

  if (error) {
    return { error: "パスワードの更新に失敗しました" }
  }

  await supabase.auth.signOut()

  return { success: true }
}

// ──────── パスワード変更 ────────
export async function changePassword(input: ChangePasswordInput) {
  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()

  // 現在のパスワードで再認証
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return { error: "ユーザー情報を取得できません" }
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  })

  if (verifyError) {
    return { error: "現在のパスワードが正しくありません" }
  }

  // パスワード更新
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  })

  if (error) {
    return { error: "パスワードの更新に失敗しました" }
  }

  return { success: true }
}
