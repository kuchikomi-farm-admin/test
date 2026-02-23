"use server"

import { createClient } from "@/lib/supabase/server"
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validations/profile"
import { revalidatePath } from "next/cache"

// ──────── プロフィール取得 ────────
export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error) return { error: "プロフィールの取得に失敗しました" }
  return { data }
}

// ──────── プロフィール更新 ────────
export async function updateProfile(input: UpdateProfileInput) {
  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) {
    return {
      error: parsed.error.errors[0].message,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      phone: parsed.data.phone || null,
      bio: parsed.data.bio || null,
      location: parsed.data.location || null,
      company: parsed.data.company || null,
      position: parsed.data.position || null,
    })
    .eq("id", user.id)

  if (error) return { error: "プロフィールの更新に失敗しました" }

  revalidatePath("/settings")
  return { success: true }
}

// ──────── 通知設定取得 ────────
export async function getNotificationPreferences() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (error) return { error: "通知設定の取得に失敗しました" }
  return { data }
}

// ──────── 通知設定更新 ────────
export async function updateNotificationPreferences(prefs: {
  emailNewContent: boolean
  emailNewsletter: boolean
  emailInviteUpdate: boolean
  lineNewContent: boolean
  lineReward: boolean
  pushBrowser: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const { error } = await supabase
    .from("notification_preferences")
    .update({
      email_new_content: prefs.emailNewContent,
      email_newsletter: prefs.emailNewsletter,
      email_invite_update: prefs.emailInviteUpdate,
      line_new_content: prefs.lineNewContent,
      line_reward: prefs.lineReward,
      push_browser: prefs.pushBrowser,
    })
    .eq("user_id", user.id)

  if (error) return { error: "通知設定の更新に失敗しました" }

  revalidatePath("/settings")
  return { success: true }
}

// ──────── 自分の招待リンク取得 ────────
export async function getMyInviteCode() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  // 永続招待コードを取得（最新1件）
  const { data, error } = await supabase
    .from("invite_codes")
    .select("code")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return { error: "招待リンクの取得に失敗しました" }

  const code = data?.code || null
  const inviteUrl = code
    ? `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${code}`
    : null

  return { code, inviteUrl }
}

// ──────── 紹介実績取得 ────────
export async function getReferralStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  // クリック数は invite_codes.click_count から集計
  const { data: codes } = await supabase
    .from("invite_codes")
    .select("click_count")
    .eq("created_by", user.id)

  const totalClicks = (codes || []).reduce((sum, c) => sum + (c.click_count || 0), 0)

  // 登録数は referrals テーブルから集計
  const { data: referrals, error } = await supabase
    .from("referrals")
    .select("id, registered_at")
    .eq("referrer_id", user.id)

  if (error) return { error: "紹介実績の取得に失敗しました" }

  const registrations = referrals?.filter(r => r.registered_at !== null).length || 0

  return {
    referralCount: registrations,
    clickCount: totalClicks,
    conversionRate: totalClicks > 0 ? ((registrations / totalClicks) * 100).toFixed(1) : "0",
  }
}

// ──────── 招待リンク取得（永続コード） ────────
export async function generateInviteCode() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const { data, error } = await supabase.rpc("generate_invite_code")

  if (error) {
    console.error("[generateInviteCode] RPC error:", error)
    return { error: `招待リンクの取得に失敗しました: ${error.message}` }
  }

  const result = data as { code?: string; error?: string } | null
  if (!result || result.error) {
    return { error: result?.error || "招待リンクの取得に失敗しました" }
  }

  const code = result.code
  const inviteUrl = code
    ? `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${code}`
    : null

  return { code, inviteUrl }
}

// ──────── 招待枠取得 ────────
export async function getInviteSlots() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const { data, error } = await supabase
    .from("invite_slots")
    .select("initial_slots, bonus_slots, used_slots")
    .eq("user_id", user.id)
    .single()

  if (error) return { error: "招待枠の取得に失敗しました" }
  return {
    initialSlots: data.initial_slots,
    bonusSlots: data.bonus_slots,
    usedSlots: data.used_slots,
  }
}

// ──────── 枠解放条件取得 ────────
const conditionLabels: Record<string, string> = {
  content_views_3: "コンテンツ3本視聴完了",
  profile_completed: "プロフィール完成",
  first_share: "初回記事シェア",
  feedback_sent: "フィードバック送信",
}

export async function getSlotUnlockConditions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const { data, error } = await supabase
    .from("slot_unlock_conditions")
    .select("condition, completed")
    .eq("user_id", user.id)

  if (error) return { error: "解放条件の取得に失敗しました" }
  return {
    conditions: (data || []).map((row) => ({
      key: row.condition,
      label: conditionLabels[row.condition] || row.condition,
      done: row.completed,
    })),
  }
}

// ──────── 報酬マイルストーン取得 ────────
export async function getRewardMilestones() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const { data: rewards, error } = await supabase
    .from("rewards")
    .select("required_referrals, title, description, icon")
    .eq("status", "active")
    .order("required_referrals", { ascending: true })

  if (error) return { error: "報酬情報の取得に失敗しました" }

  return {
    milestones: (rewards || []).map((r) => ({
      target: r.required_referrals,
      label: `${r.required_referrals}人達成`,
      reward: r.title,
      icon: r.icon,
    })),
  }
}

// ──────── ログイン履歴取得 ────────
export async function getLoginHistory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const { data, error } = await supabase
    .from("login_history")
    .select("*")
    .eq("user_id", user.id)
    .order("logged_in_at", { ascending: false })
    .limit(10)

  if (error) return { error: "ログイン履歴の取得に失敗しました" }
  return { data }
}
