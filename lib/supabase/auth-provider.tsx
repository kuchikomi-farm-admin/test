"use client"

import { useEffect, useRef } from "react"
import { createClient } from "./client"
import { useUserStore } from "@/lib/store/use-user-store"
import type { UserProfile } from "@/lib/store/use-user-store"

const rankLabelMap: Record<string, string> = {
  standard: "スタンダード",
  gold: "ゴールド",
  platinum: "プラチナ",
  diamond: "ダイヤモンド",
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useUserStore((s) => s.setUser)
  const setLoading = useUserStore((s) => s.setLoading)
  const lastUserId = useRef<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        lastUserId.current = null
        setUser(null)
        return
      }

      // ユーザーIDが変更されていなければスキップ（不要な再取得を防止）
      if (lastUserId.current === user.id) return
      lastUserId.current = user.id

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (!profile) {
        setUser(null)
        return
      }

      const userProfile: UserProfile = {
        id: profile.id,
        name: profile.display_name,
        email: profile.email,
        memberId: profile.member_id,
        rank: rankLabelMap[profile.rank] || profile.rank,
        role: profile.role,
        status: profile.status,
        avatarUrl: profile.avatar_url,
        phone: profile.phone,
        bio: profile.bio,
        location: profile.location,
        company: profile.company,
        position: profile.position,
      }
      setUser(userProfile)
    }

    async function forceRefreshAndLoad() {
      // サーバーサイドで設定されたセッションCookieを確実に反映するためリフレッシュ
      await supabase.auth.refreshSession()
      lastUserId.current = null  // 強制再取得
      await loadUser()
    }

    forceRefreshAndLoad()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) {
          lastUserId.current = null
          setUser(null)
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          // セッション変更時は強制的に再読み込み
          lastUserId.current = null
          loadUser()
        } else {
          loadUser()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setLoading])

  return <>{children}</>
}
