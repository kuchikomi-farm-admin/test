"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Camera, Save, Shield, Bell, User, KeyRound, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const tabs = [
  { id: "profile", label: "プロフィール", icon: User },
  { id: "security", label: "セキュリティ", icon: Shield },
  { id: "notifications", label: "通知設定", icon: Bell },
] as const

type TabId = (typeof tabs)[number]["id"]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile")
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  const [profile, setProfile] = useState({
    displayName: "田中 太郎",
    email: "tanaka@example.com",
    phone: "090-1234-5678",
    bio: "地方創生に関心を持つマーケター。東京在住。週末は地方巡り。",
    location: "東京都渋谷区",
    company: "株式会社サンプル",
    position: "マーケティング部長",
  })

  const [notifications, setNotifications] = useState({
    emailNewContent: true,
    emailNewsletter: true,
    emailInviteUpdate: true,
    lineNewContent: false,
    lineReward: true,
    pushBrowser: false,
  })

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

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
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
                  <span className="text-2xl font-serif text-[#1B3022]/50">{"田"}</span>
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
                <p className="text-sm font-medium text-[#1B3022]">{profile.displayName}</p>
                <p className="text-xs text-[#D4AF37]">{"会員No. JK-00247"}</p>
                <p className="text-xs text-[#1B3022]/30 mt-0.5">{"会員ランク: スタンダード"}</p>
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
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="h-11 border-[#1B3022]/10"
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
                <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B3022] gap-2">
                  <Save className="w-4 h-4" />
                  {"変更を保存"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-6">
            {/* Password Change */}
            <div className="rounded-xl border border-[#1B3022]/8 bg-background p-6 space-y-5">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-serif text-lg text-[#1B3022]">{"パスワード変更"}</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-[#1B3022]/50">{"現在のパスワード"}</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPw ? "text" : "password"}
                      placeholder="現在のパスワードを入力"
                      className="h-11 border-[#1B3022]/10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B3022]/30 hover:text-[#1B3022]/60"
                      aria-label={showCurrentPw ? "パスワードを隠す" : "パスワードを表示"}
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[#1B3022]/50">{"新しいパスワード"}</Label>
                  <div className="relative">
                    <Input
                      type={showNewPw ? "text" : "password"}
                      placeholder="新しいパスワードを入力"
                      className="h-11 border-[#1B3022]/10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B3022]/30 hover:text-[#1B3022]/60"
                      aria-label={showNewPw ? "パスワードを隠す" : "パスワードを表示"}
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#1B3022]/30">{"8文字以上、英数字と記号を含めてください"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[#1B3022]/50">{"新しいパスワード（確認）"}</Label>
                  <Input
                    type="password"
                    placeholder="新しいパスワードを再入力"
                    className="h-11 border-[#1B3022]/10"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B3022] gap-2">
                  <Shield className="w-4 h-4" />
                  {"パスワードを更新"}
                </Button>
              </div>
            </div>

            {/* Login History */}
            <div className="rounded-xl border border-[#1B3022]/8 bg-background p-6 space-y-4">
              <h3 className="font-serif text-lg text-[#1B3022]">{"ログイン履歴"}</h3>
              <div className="space-y-3">
                {[
                  { device: "Chrome / macOS", ip: "203.0.113.xx", time: "2026年2月9日 10:32", current: true },
                  { device: "Safari / iOS", ip: "203.0.113.xx", time: "2026年2月8日 18:15", current: false },
                  { device: "Chrome / Windows", ip: "198.51.100.xx", time: "2026年2月7日 09:45", current: false },
                ].map((session, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-[#1B3022]/5 last:border-0">
                    <div>
                      <p className="text-sm text-[#1B3022]">
                        {session.device}
                        {session.current && (
                          <span className="ml-2 text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-full">
                            {"現在のセッション"}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[#1B3022]/30 mt-0.5">{`${session.ip} - ${session.time}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl border border-red-200 bg-red-50/30 p-6 space-y-4">
              <h3 className="font-serif text-lg text-red-700">{"アカウント削除"}</h3>
              <p className="text-xs text-red-600/60 leading-relaxed">
                {"アカウントを削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。"}
              </p>
              <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent">
                {"アカウントを削除する"}
              </Button>
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
              <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B3022] gap-2">
                <Save className="w-4 h-4" />
                {"通知設定を保存"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
