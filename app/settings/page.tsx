"use client"

import { useState, useEffect } from "react"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Camera, Save, Bell, User } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useUserStore } from "@/lib/store/use-user-store"
import {
  updateProfile,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/app/actions/profile"

const tabs = [
  { id: "profile", label: "プロフィール", icon: User },
  { id: "notifications", label: "通知設定", icon: Bell },
] as const

type TabId = (typeof tabs)[number]["id"]

export default function SettingsPage() {
  const { user, updateProfile: updateStoreProfile } = useUserStore()
  const [activeTab, setActiveTab] = useState<TabId>("profile")

  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [error, setError] = useState("")

  // Profile form state
  const [profile, setProfile] = useState({
    displayName: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
    company: "",
    position: "",
  })



  // Notification state
  const [notifications, setNotifications] = useState({
    emailNewContent: true,
    emailNewsletter: true,
    emailInviteUpdate: true,
    lineNewContent: false,
    lineReward: true,
    pushBrowser: false,
  })



  // Initialize profile from store
  useEffect(() => {
    if (user) {
      setProfile({
        displayName: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        location: user.location || "",
        company: user.company || "",
        position: user.position || "",
      })
    }
  }, [user])

  // Load notification preferences
  useEffect(() => {
    getNotificationPreferences().then((result) => {
      if (result.data) {
        setNotifications({
          emailNewContent: result.data.email_new_content,
          emailNewsletter: result.data.email_newsletter,
          emailInviteUpdate: result.data.email_invite_update,
          lineNewContent: result.data.line_new_content,
          lineReward: result.data.line_reward,
          pushBrowser: result.data.push_browser,
        })
      }
    })
  }, [])



  const handleProfileSave = async () => {
    setError("")
    setSaveMessage("")
    setIsSaving(true)

    const result = await updateProfile({
      displayName: profile.displayName,
      phone: profile.phone,
      bio: profile.bio,
      location: profile.location,
      company: profile.company,
      position: profile.position,
    })

    setIsSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    updateStoreProfile({ name: profile.displayName, phone: profile.phone, bio: profile.bio, location: profile.location, company: profile.company, position: profile.position })
    setSaveMessage("プロフィールを更新しました")
    setTimeout(() => setSaveMessage(""), 3000)
  }



  const handleNotificationSave = async () => {
    setError("")
    setSaveMessage("")
    setIsSaving(true)

    const result = await updateNotificationPreferences(notifications)
    setIsSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSaveMessage("通知設定を更新しました")
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

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setActiveTab(tab.id); setError(""); setSaveMessage("") }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors",
                  activeTab === tab.id
                    ? "bg-[#1B3022] text-[#D4AF37]"
                    : "text-[#1B3022]/50 hover:text-[#1B3022] hover:bg-[#1B3022]/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
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
                <p className="text-xs text-[#1B3022]/30 mt-0.5">{`会員ランク: ${user?.rank || "---"}`}</p>
              </div>
            </div>

            {/* Form */}
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

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-[#1B3022]/50">{"電話番号"}</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="h-11 border-[#1B3022]/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[#1B3022]/50">{"所在地"}</Label>
                  <Input
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="h-11 border-[#1B3022]/10"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-[#1B3022]/50">{"所属組織"}</Label>
                  <Input
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    className="h-11 border-[#1B3022]/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[#1B3022]/50">{"役職"}</Label>
                  <Input
                    value={profile.position}
                    onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                    className="h-11 border-[#1B3022]/10"
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
        )}



        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            {/* Email Notifications */}
            <div className="rounded-xl border border-[#1B3022]/8 bg-background p-6 space-y-5">
              <h3 className="font-serif text-lg text-[#1B3022]">{"メール通知"}</h3>
              <div className="space-y-4">
                {[
                  { key: "emailNewContent" as const, label: "新しいコンテンツ配信", desc: "記事や動画が公開された際に通知" },
                  { key: "emailNewsletter" as const, label: "メールマガジン", desc: "定期的なニュースレターを受信" },
                  { key: "emailInviteUpdate" as const, label: "招待状況の更新", desc: "招待した方の登録完了や報酬の通知" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm text-[#1B3022]">{item.label}</p>
                      <p className="text-xs text-[#1B3022]/30 mt-0.5">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key]}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* LINE Notifications */}
            <div className="rounded-xl border border-[#1B3022]/8 bg-background p-6 space-y-5">
              <h3 className="font-serif text-lg text-[#1B3022]">{"LINE通知"}</h3>
              <div className="space-y-4">
                {[
                  { key: "lineNewContent" as const, label: "新しいコンテンツ配信", desc: "LINEで新着コンテンツを通知" },
                  { key: "lineReward" as const, label: "報酬・特典の更新", desc: "ランクアップや特典解放の通知" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm text-[#1B3022]">{item.label}</p>
                      <p className="text-xs text-[#1B3022]/30 mt-0.5">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key]}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Browser Push */}
            <div className="rounded-xl border border-[#1B3022]/8 bg-background p-6 space-y-5">
              <h3 className="font-serif text-lg text-[#1B3022]">{"ブラウザ通知"}</h3>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-[#1B3022]">{"プッシュ通知"}</p>
                  <p className="text-xs text-[#1B3022]/30 mt-0.5">{"ブラウザのプッシュ通知を有効にする"}</p>
                </div>
                <Switch
                  checked={notifications.pushBrowser}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, pushBrowser: checked })}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleNotificationSave}
                disabled={isSaving}
                className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B3022] gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "保存中..." : "通知設定を保存"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
