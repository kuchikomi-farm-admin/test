"use client"

import { useEffect } from "react"
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

  useEffect(() => {
    const supabase = createClient()

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setUser(null)
        return
      }

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

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          setUser(null)
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
