"use client"

import { useState, useEffect } from "react"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Camera, Save, Bell } from "lucide-react"
import Link from "next/link"
import { useUserStore } from "@/lib/store/use-user-store"
import { updateProfile } from "@/app/actions/profile"

export default function SettingsPage() {
  const { user, updateProfile: updateStoreProfile } = useUserStore()

  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [error, setError] = useState("")

  // Profile form state
  const [profile, setProfile] = useState({
    displayName: "",
    email: "",
    bio: "",
  })

  // Initialize profile from store
  useEffect(() => {
    if (user) {
      setProfile({
        displayName: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
      })
    }
  }, [user])

  const handleProfileSave = async () => {
    setError("")
    setSaveMessage("")
    setIsSaving(true)

    const result = await updateProfile({
      displayName: profile.displayName,
      bio: profile.bio,
    })

    setIsSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    updateStoreProfile({ name: profile.displayName, bio: profile.bio })
    setSaveMessage("プロフィールを更新しました")
    setTimeout(() => setSaveMessage(""), 3000)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 md:px-6 py-8 space-y-8">
        {/* Back link */}
        <Link
          href="/mypage"
          className="inline-flex items-center gap-2 text-sm text-[#1B3022]/40 hover:text-[#1B3022] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {"マイページに戻る"}
        </Link>

        {/* Header */}
        <div>
          <p className="text-xs text-[#1B3022]/40 tracking-wider uppercase">{"Settings"}</p>
          <h1 className="font-serif text-2xl text-[#1B3022] mt-1">{"アカウント設定"}</h1>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        {saveMessage && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
            <p className="text-sm text-green-700">{saveMessage}</p>
          </div>
        )}

        {/* Profile */}
        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#1B3022]/10 flex items-center justify-center">
                <span className="text-2xl font-serif text-[#1B3022]/50">
                  {user?.name?.[0] || "?"}
                </span>
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center hover:bg-[#D4AF37]/90 transition-colors"
                aria-label="写真を変更"
              >
                <Camera className="w-4 h-4 text-[#1B3022]" />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-[#1B3022]">{user?.name || ""}</p>
              <p className="text-xs text-[#D4AF37]">{`会員No. ${user?.memberId || "---"}`}</p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="rounded-xl border border-[#1B3022]/8 bg-background p-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-[#1B3022]/50">{"表示名"}</Label>
                <Input
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  className="h-11 border-[#1B3022]/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-[#1B3022]/50">{"メールアドレス"}</Label>
                <Input
                  type="email"
                  value={profile.email}
                  disabled
                  className="h-11 border-[#1B3022]/10 bg-[#1B3022]/3"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-[#1B3022]/50">{"自己紹介"}</Label>
              <Textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="min-h-[100px] border-[#1B3022]/10 resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleProfileSave}
                disabled={isSaving}
                className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B3022] gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "保存中..." : "変更を保存"}
              </Button>
            </div>
          </div>
        </div>

        {/* Notification Settings (Coming Soon) */}
        <div className="space-y-4 opacity-50 pointer-events-none select-none">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#1B3022]/40" />
            <h2 className="font-serif text-lg text-[#1B3022]/60">{"通知設定"}</h2>
            <span className="text-[10px] bg-[#1B3022]/10 text-[#1B3022]/40 px-2 py-0.5 rounded tracking-wider">
              {"開発中"}
            </span>
          </div>
          <div className="rounded-xl border border-[#1B3022]/8 bg-background p-6 space-y-4">
            {[
              { label: "新着コンテンツ通知", desc: "新しい記事や動画が公開された際にメールで通知" },
              { label: "メールマガジン", desc: "週間ダイジェストやおすすめコンテンツの配信" },
              { label: "招待ステータス通知", desc: "招待した方の登録状況をメールで通知" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-[#1B3022]/60">{item.label}</p>
                  <p className="text-xs text-[#1B3022]/30 mt-0.5">{item.desc}</p>
                </div>
                <div className="w-10 h-6 rounded-full bg-[#1B3022]/10 relative">
                  <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-[#1B3022]/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
