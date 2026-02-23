"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

// ──────── 管理者権限チェック ────────
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("未認証です")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") throw new Error("管理者権限がありません")
  return user
}

// ──────── ユーザー一覧取得 ────────
export async function getAdminUsers() {
  await requireAdmin()

  const adminClient = createAdminClient()

  // profiles + referral stats を取得
  const { data: profiles, error } = await adminClient
    .from("profiles")
    .select("id, display_name, email, status, role, rank, created_at")
    .order("created_at", { ascending: false })

  if (error) return { error: "ユーザー一覧の取得に失敗しました" }

  // 各ユーザーの紹介実績を取得
  const users = await Promise.all(
    (profiles || []).map(async (p) => {
      // クリック数は invite_codes.click_count から集計
      const { data: codes } = await adminClient
        .from("invite_codes")
        .select("click_count")
        .eq("created_by", p.id)

      const clicks = (codes || []).reduce((sum, c) => sum + (c.click_count || 0), 0)

      // 登録数は referrals テーブルから集計
      const { data: referrals } = await adminClient
        .from("referrals")
        .select("id, registered_at")
        .eq("referrer_id", p.id)

      const registrations = referrals?.filter((r) => r.registered_at !== null).length || 0

      return {
        id: p.id,
        name: p.display_name || "(未設定)",
        email: p.email,
        referrals: registrations,
        clicks,
        registrations,
        status: p.status as "active" | "pending",
        joinDate: p.created_at,
      }
    })
  )

  return { users }
}

// ──────── ダッシュボード統計 ────────
export async function getDashboardStats() {
  await requireAdmin()
  const adminClient = createAdminClient()

  // 全プロフィール取得
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, status, created_at")

  const allUsers = profiles || []
  const totalUsers = allUsers.length
  const activeUsers = allUsers.filter((p) => p.status === "active").length
  const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

  // 今月の新規登録
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthlyNewUsers = allUsers.filter((p) => p.created_at >= monthStart).length

  // コンテンツ数
  const { count: contentCount } = await adminClient
    .from("contents")
    .select("id", { count: "exact", head: true })

  // 月別登録推移（直近6ヶ月）
  const growthData = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    const label = `${d.getMonth() + 1}月`
    const total = allUsers.filter((p) => new Date(p.created_at) <= monthEnd).length
    growthData.push({ month: label, total, invited: 0 })
  }

  // 当日を含む過去7日間の日別登録数
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"]
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayStart.getDate() + 1)
    const registrations = allUsers.filter((p) => {
      const c = new Date(p.created_at)
      return c >= dayStart && c < dayEnd
    }).length
    const label = i === 6 ? "今日" : `${dayStart.getMonth() + 1}/${dayStart.getDate()}(${dayNames[dayStart.getDay()]})`
    return { day: label, registrations }
  })

  return {
    stats: {
      totalUsers,
      activeRate,
      monthlyNewUsers,
      contentCount: contentCount || 0,
    },
    growthData,
    weeklyData,
  }
}

// ──────── 特典一覧取得（3固定ティア自動作成付き） ────────
const DEFAULT_TIERS = [
  { required_referrals: 10, title: "非公開有料コンテンツ（1万円相当）", description: "10人招待達成の特典", icon: "Gift" },
  { required_referrals: 100, title: "10万円級プレミアムサロン参加", description: "100人招待達成の特典", icon: "Star" },
  { required_referrals: 1000, title: "主宰者・一流人材との1on1予約", description: "1000人招待達成の特典", icon: "Crown" },
]

export async function getAdminRewards() {
  await requireAdmin()
  const adminClient = createAdminClient()

  // 既存の特典を取得
  let { data: rewards } = await adminClient
    .from("rewards")
    .select("*")
    .order("required_referrals", { ascending: true })

  // 3固定ティアが存在しなければ自動作成
  if (!rewards || rewards.length === 0) {
    for (const tier of DEFAULT_TIERS) {
      await adminClient.from("rewards").insert(tier)
    }
    const result = await adminClient
      .from("rewards")
      .select("*")
      .order("required_referrals", { ascending: true })
    rewards = result.data || []
  }

  // 各ティアの達成者数を計算
  const { data: allReferrals } = await adminClient
    .from("referrals")
    .select("referrer_id, registered_at")

  // referrer_id ごとの登録完了数を集計
  const referralCounts: Record<string, number> = {}
  for (const r of allReferrals || []) {
    if (r.registered_at) {
      referralCounts[r.referrer_id] = (referralCounts[r.referrer_id] || 0) + 1
    }
  }

  const rewardsWithStats = rewards.map((reward) => {
    const achievedCount = Object.values(referralCounts).filter(
      (count) => count >= reward.required_referrals
    ).length
    return {
      id: reward.id,
      title: reward.title,
      description: reward.description,
      requiredReferrals: reward.required_referrals,
      icon: reward.icon,
      status: reward.status,
      achievedCount,
    }
  })

  // 達成者の詳細リスト（10人以上の招待実績があるユーザー）
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, display_name")

  const profileMap = new Map((profiles || []).map((p) => [p.id, p.display_name || "(未設定)"]))

  const achievers = Object.entries(referralCounts)
    .filter(([, count]) => count >= 10)
    .map(([userId, count]) => ({
      id: userId,
      name: profileMap.get(userId) || "(未設定)",
      referrals: count,
    }))
    .sort((a, b) => b.referrals - a.referrals)

  return { rewards: rewardsWithStats, achievers }
}

// ──────── 特典内容更新 ────────
export async function updateAdminReward(rewardId: string, title: string, description: string) {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from("rewards")
    .update({ title, description })
    .eq("id", rewardId)

  if (error) return { error: "特典の更新に失敗しました" }

  revalidatePath("/admin")
  return { success: true }
}

// ──────── ユーザーステータス更新 ────────
export async function updateUserStatus(userId: string, newStatus: "active" | "pending") {
  await requireAdmin()

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from("profiles")
    .update({ status: newStatus })
    .eq("id", userId)

  if (error) return { error: "ステータスの更新に失敗しました" }

  revalidatePath("/admin")
  return { success: true }
}
