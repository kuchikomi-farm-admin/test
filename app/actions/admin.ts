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
      const { data: referrals } = await adminClient
        .from("referrals")
        .select("id, referred_id, clicked_at, registered_at")
        .eq("referrer_id", p.id)

      const clicks = referrals?.length || 0
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
