"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Copy, Check, Link2, Gift, Users, Star, Crown, Lock, Unlock, Eye } from "lucide-react"

const milestones = [
  {
    target: 10,
    label: "10人達成",
    reward: "非公開有料コンテンツ（1万円相当）",
    icon: Gift,
    color: "bg-[#D4AF37]/20 text-[#D4AF37]",
  },
  {
    target: 100,
    label: "100人達成",
    reward: "10万円級プレミアムサロン参加",
    icon: Star,
    color: "bg-[#D4AF37]/30 text-[#D4AF37]",
  },
  {
    target: 1000,
    label: "1000人達成",
    reward: "主宰者・一流人材との1on1予約",
    icon: Crown,
    color: "bg-[#D4AF37]/40 text-[#D4AF37]",
  },
]

export default function MyPage() {
  const [copied, setCopied] = useState(false)
  const referralCount = 24
  const inviteSlots = { total: 2, used: 1, bonus: 3 }
  const referralUrl = "https://junkan.app/invite/abc123xyz"

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 md:px-6 py-8 space-y-8">
        {/* Greeting */}
        <div>
          <p className="text-xs text-[#1B3022]/40 tracking-wider uppercase">My Page</p>
          <h1 className="font-serif text-2xl text-[#1B3022] mt-1">{"田中 太郎"}</h1>
          <p className="text-sm text-[#1B3022]/50 mt-1">{"会員No. JK-00247"}</p>
        </div>

        {/* Referral URL Card */}
        <section className="rounded-xl bg-[#1B3022] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-sm font-medium tracking-wider text-[#D4AF37]">{"紹介用URL"}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-[#F8F9FA]/10 rounded-lg px-4 py-3 text-sm text-[#F8F9FA]/70 truncate font-mono">
              {referralUrl}
            </div>
            <Button
              onClick={handleCopy}
              size="icon"
              className="shrink-0 h-11 w-11 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B3022]"
              aria-label="URLをコピー"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-[#F8F9FA]/30">
            {"このURLを共有して新しい仲間を招待しましょう"}
          </p>
        </section>

        {/* Reward Roadmap */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-serif text-lg text-[#1B3022]">{"報酬ロードマップ"}</h2>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1B3022]/5">
            <div className="text-center">
              <p className="text-3xl font-serif text-[#1B3022]">{referralCount}</p>
              <p className="text-xs text-[#1B3022]/40">{"紹介数"}</p>
            </div>
            <div className="h-10 w-px bg-[#1B3022]/10" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#1B3022]/60">{"次の目標: 100人"}</span>
                <span className="text-[#D4AF37] font-medium">{`${referralCount}%`}</span>
              </div>
              <Progress value={(referralCount / 100) * 100} className="h-2 bg-[#1B3022]/10 [&>div]:bg-[#D4AF37]" />
            </div>
          </div>

          <div className="space-y-3">
            {milestones.map((m) => {
              const achieved = referralCount >= m.target
              const Icon = m.icon
              return (
                <div
                  key={m.target}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                    achieved
                      ? "border-[#D4AF37]/30 bg-[#D4AF37]/5"
                      : "border-[#1B3022]/8 bg-background"
                  }`}
                >
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${m.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${achieved ? "text-[#1B3022]" : "text-[#1B3022]/60"}`}>
                      {m.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${achieved ? "text-[#1B3022]/60" : "text-[#1B3022]/30"}`}>
                      {m.reward}
                    </p>
                  </div>
                  {achieved ? (
                    <span className="text-xs bg-[#D4AF37] text-[#1B3022] px-3 py-1 rounded-full font-medium">
                      {"達成"}
                    </span>
                  ) : (
                    <span className="text-xs text-[#1B3022]/30">{`${referralCount}/${m.target}`}</span>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Invitation Responsibility Score */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-serif text-lg text-[#1B3022]">{"招待責任スコア"}</h2>
          </div>

          <div className="rounded-xl border border-[#1B3022]/8 bg-background p-5 space-y-5">
            {/* Slot overview */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#1B3022]/60">{"現在の招待枠"}</p>
                <p className="text-2xl font-serif text-[#1B3022] mt-1">
                  {inviteSlots.total - inviteSlots.used + inviteSlots.bonus}
                  <span className="text-sm text-[#1B3022]/40 ml-1">{"枠"}</span>
                </p>
              </div>
              <div className="flex items-center gap-4 text-center">
                <div>
                  <p className="text-lg font-serif text-[#1B3022]">{inviteSlots.total}</p>
                  <p className="text-[10px] text-[#1B3022]/40">{"初期枠"}</p>
                </div>
                <div className="h-8 w-px bg-[#1B3022]/10" />
                <div>
                  <p className="text-lg font-serif text-[#D4AF37]">{`+${inviteSlots.bonus}`}</p>
                  <p className="text-[10px] text-[#1B3022]/40">{"追加枠"}</p>
                </div>
                <div className="h-8 w-px bg-[#1B3022]/10" />
                <div>
                  <p className="text-lg font-serif text-[#1B3022]/40">{inviteSlots.used}</p>
                  <p className="text-[10px] text-[#1B3022]/40">{"使用済"}</p>
                </div>
              </div>
            </div>

            {/* Slot unlock conditions */}
            <div className="space-y-2">
              <p className="text-xs text-[#1B3022]/40 tracking-wider uppercase">{"枠の解放ステータス"}</p>
              <div className="space-y-2">
                {[
                  { label: "コンテンツ3本視聴完了", done: true },
                  { label: "プロフィール完成", done: true },
                  { label: "初回記事シェア", done: false },
                  { label: "フィードバック送信", done: false },
                ].map((condition) => (
                  <div key={condition.label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#F8F9FA]">
                    {condition.done ? (
                      <Unlock className="w-4 h-4 text-[#D4AF37]" />
                    ) : (
                      <Lock className="w-4 h-4 text-[#1B3022]/20" />
                    )}
                    <span className={`text-sm ${condition.done ? "text-[#1B3022]" : "text-[#1B3022]/35"}`}>
                      {condition.label}
                    </span>
                    {condition.done && (
                      <span className="ml-auto text-[10px] text-[#D4AF37] font-medium tracking-wider">{"DONE"}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick stats */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: "紹介クリック数", value: "156", icon: Eye },
            { label: "登録完了数", value: "24", icon: Users },
            { label: "コンバージョン", value: "15.4%", icon: Star },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="text-center p-4 rounded-xl border border-[#1B3022]/8 bg-background">
                <Icon className="w-4 h-4 text-[#D4AF37] mx-auto mb-2" />
                <p className="text-xl font-serif text-[#1B3022]">{stat.value}</p>
                <p className="text-[10px] text-[#1B3022]/40 mt-1">{stat.label}</p>
              </div>
            )
          })}
        </section>
      </main>
    </div>
  )
}
