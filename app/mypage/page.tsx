"use client"

import { useState, useEffect } from "react"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Copy, Check, Link2, Gift, Users, Star, Crown, Eye } from "lucide-react"
import { getMyInviteCode, getReferralStats, getProfile, getRewardMilestones } from "@/app/actions/profile"

const ICON_MAP: Record<string, typeof Gift> = { Gift, Star, Crown }
const COLOR_MAP: Record<number, string> = {
  10: "bg-[#D4AF37]/20 text-[#D4AF37]",
  100: "bg-[#D4AF37]/30 text-[#D4AF37]",
  1000: "bg-[#D4AF37]/40 text-[#D4AF37]",
}

const DEFAULT_MILESTONES = [
  { target: 10, label: "10人達成", reward: "非公開有料コンテンツ（1万円相当）", icon: "Gift" },
  { target: 100, label: "100人達成", reward: "10万円級プレミアムサロン参加", icon: "Star" },
  { target: 1000, label: "1000人達成", reward: "主宰者・一流人材との1on1予約", icon: "Crown" },
]

export default function MyPage() {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [referralCount, setReferralCount] = useState(0)
  const [clickCount, setClickCount] = useState(0)
  const [conversionRate, setConversionRate] = useState("0")
  const [userName, setUserName] = useState("")
  const [memberId, setMemberId] = useState("")
  const [milestones, setMilestones] = useState(DEFAULT_MILESTONES)

  useEffect(() => {
    setMounted(true)
    getMyInviteCode().then((result) => {
      if ("inviteUrl" in result && result.inviteUrl) setInviteUrl(result.inviteUrl)
    })
    getReferralStats().then((result) => {
      if ("referralCount" in result) {
        setReferralCount(result.referralCount)
        setClickCount(result.clickCount)
        setConversionRate(result.conversionRate)
      }
    })
    getProfile().then((result) => {
      if ("data" in result && result.data) {
        setUserName(result.data.display_name)
        setMemberId(result.data.member_id)
      }
    })
    getRewardMilestones().then((result) => {
      if ("milestones" in result && result.milestones.length > 0) setMilestones(result.milestones)
    }).catch(() => {})
  }, [])

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 md:px-6 py-8 space-y-8">
        {/* Greeting */}
        <div>
          <p className="text-xs text-[#1B3022]/40 tracking-wider uppercase">My Page</p>
          <h1 className="font-serif text-2xl text-[#1B3022] mt-1">{userName || "---"}</h1>
          <p className="text-sm text-[#1B3022]/50 mt-1">{`会員No. ${memberId || "---"}`}</p>
        </div>

        {/* Invite Link Card */}
        <section className="rounded-xl bg-[#1B3022] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-sm font-medium tracking-wider text-[#D4AF37]">{"あなたの招待リンク"}</h2>
          </div>

          {inviteUrl ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded-xl px-5 py-4 bg-[#F8F9FA]/10 border-2 border-transparent">
                  <p className="text-sm text-[#F8F9FA] font-mono break-all select-all">
                    {inviteUrl}
                  </p>
                </div>
                <Button
                  onClick={handleCopy}
                  className={`shrink-0 h-14 px-5 gap-2 font-medium transition-all duration-300 ${copied ? "bg-green-500 hover:bg-green-500 text-white" : "bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B3022]"}`}
                  aria-label="リンクをコピー"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span className="text-sm">{"コピー済"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span className="text-sm">{"コピー"}</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#F8F9FA]/40 text-center">
                {"この招待リンクを共有して新しい仲間を招待しましょう"}
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-[#F8F9FA]/40">{"招待リンクを読み込み中..."}</p>
            </div>
          )}

          {/* SNS Share Buttons */}
          {inviteUrl && (
            <div className="flex items-center gap-3 pt-2">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("TheJapanLocalMediaに参加しませんか？")}&url=${encodeURIComponent(inviteUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-[#1DA1F2] text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                {"X"}
              </a>
              <a
                href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent("TheJapanLocalMediaに参加しませんか？")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#06C755]/20 hover:bg-[#06C755]/30 text-[#06C755] text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" /></svg>
                {"LINE"}
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#1877F2] text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                {"Facebook"}
              </a>
            </div>
          )}
        </section>

        {/* Reward Roadmap */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-serif text-lg text-[#1B3022]">{"報酬ロードマップ"}</h2>
          </div>

          {(() => {
            const nextMilestone = milestones.find((m) => referralCount < m.target) || milestones[milestones.length - 1]
            const progress = nextMilestone ? Math.min((referralCount / nextMilestone.target) * 100, 100) : 100
            return (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1B3022]/5">
                <div className="text-center">
                  <p className="text-3xl font-serif text-[#1B3022]">{referralCount}</p>
                  <p className="text-xs text-[#1B3022]/40">{"紹介数"}</p>
                </div>
                <div className="h-10 w-px bg-[#1B3022]/10" />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[#1B3022]/60">{`次の目標: ${nextMilestone.target}人`}</span>
                    <span className="text-[#D4AF37] font-medium">{`${Math.round(progress)}%`}</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-[#1B3022]/10 [&>div]:bg-[#D4AF37]" />
                </div>
              </div>
            )
          })()}

          <div className="space-y-3">
            {milestones.map((m) => {
              const achieved = referralCount >= m.target
              const Icon = ICON_MAP[m.icon] || Gift
              const color = COLOR_MAP[m.target] || "bg-[#D4AF37]/20 text-[#D4AF37]"
              return (
                <div
                  key={m.target}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${achieved
                    ? "border-[#D4AF37]/30 bg-[#D4AF37]/5"
                    : "border-[#1B3022]/8 bg-background"
                    }`}
                >
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
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

        {/* Quick stats */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: "紹介クリック数", value: clickCount.toString(), icon: Eye },
            { label: "登録完了数", value: referralCount.toString(), icon: Users },
            { label: "コンバージョン", value: `${conversionRate}%`, icon: Star },
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
