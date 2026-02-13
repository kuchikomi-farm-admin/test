"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Gift, Star, Crown, Check, Edit2, X } from "lucide-react"
import { useRewardStore } from "@/lib/store/use-reward-store"
import { useAdminUserStore } from "@/lib/store/use-admin-user-store"
import { cn } from "@/lib/utils"

const FIXED_TIERS = [
  { requiredReferrals: 10, icon: Gift, label: "10人達成", color: "bg-[#D4AF37]/20 text-[#D4AF37]" },
  { requiredReferrals: 100, icon: Star, label: "100人達成", color: "bg-[#D4AF37]/30 text-[#D4AF37]" },
  { requiredReferrals: 1000, icon: Crown, label: "1000人達成", color: "bg-[#D4AF37]/40 text-[#D4AF37]" },
]

export function AdminRewards() {
  const { rewards, updateReward } = useRewardStore()
  const { users } = useAdminUserStore()
  const [mounted, setMounted] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDesc, setEditDesc] = useState("")

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  // 固定ティアに対応するrewardを取得
  const tierRewards = FIXED_TIERS.map((tier) => {
    const reward = rewards.find(r => r.requiredReferrals === tier.requiredReferrals)
    const achievedCount = users.filter(u => u.referrals >= tier.requiredReferrals).length
    return {
      ...tier,
      reward,
      achievedCount,
    }
  })

  const handleStartEdit = (reward: { id: string; title: string; description: string }) => {
    setEditingId(reward.id)
    setEditTitle(reward.title)
    setEditDesc(reward.description)
  }

  const handleSaveEdit = (id: string) => {
    if (!editTitle) return
    updateReward(id, { title: editTitle, description: editDesc })
    setEditingId(null)
  }

  return (
    <div className="space-y-8">
      {/* Tier Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif text-[#1B3022]">{"報酬ロードマップ管理"}</h2>
        <p className="text-xs text-[#1B3022]/40">{"3段階の固定マイルストーン（10人 / 100人 / 1000人）の内容を編集できます。"}</p>

        <div className="space-y-4">
          {tierRewards.map((tier) => {
            const Icon = tier.icon
            const isEditing = editingId === tier.reward?.id

            return (
              <div
                key={tier.requiredReferrals}
                className="rounded-xl border border-[#1B3022]/8 bg-background p-5 space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("shrink-0 w-12 h-12 rounded-full flex items-center justify-center", tier.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-medium text-[#1B3022]">{tier.label}</h3>
                      <Badge variant="outline" className="border-[#1B3022]/10 text-[#1B3022]/60">
                        {`${tier.requiredReferrals}名招待`}
                      </Badge>
                    </div>
                    {tier.reward && !isEditing && (
                      <div className="mt-1.5">
                        <p className="text-sm text-[#1B3022]/80">{tier.reward.title}</p>
                        <p className="text-xs text-[#1B3022]/40 mt-0.5">{tier.reward.description}</p>
                      </div>
                    )}
                    {!tier.reward && !isEditing && (
                      <p className="text-xs text-[#1B3022]/30 mt-1">{"未設定"}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-lg font-serif text-[#1B3022]">{tier.achievedCount}</p>
                      <p className="text-[10px] text-[#1B3022]/40">{"達成者"}</p>
                    </div>
                    {tier.reward && !isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStartEdit(tier.reward!)}
                        className="text-[#1B3022]/40 hover:text-[#1B3022]"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Inline edit form */}
                {isEditing && tier.reward && (
                  <div className="space-y-3 pt-3 border-t border-[#1B3022]/8">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#1B3022]/40 uppercase tracking-wider">{"特典名"}</label>
                      <Input
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#1B3022]/40 uppercase tracking-wider">{"説明文"}</label>
                      <Input
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                        className="text-[#1B3022]/40"
                      >
                        <X className="w-4 h-4 mr-1" />
                        {"キャンセル"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(tier.reward!.id)}
                        className="bg-[#1B3022] text-[#D4AF37]"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        {"保存"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Achievement Tracking Section */}
      <div className="space-y-4 pt-8 border-t border-[#1B3022]/5">
        <h2 className="text-lg font-serif text-[#1B3022]">{"特典付与ステータス"}</h2>
        <div className="rounded-xl border border-[#1B3022]/8 bg-background overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-[#1B3022]/8">
                <TableHead className="text-xs text-[#1B3022]/40 font-medium py-4 px-6">{"ユーザー"}</TableHead>
                <TableHead className="text-xs text-[#1B3022]/40 font-medium py-4 px-6">{"達成ティア"}</TableHead>
                <TableHead className="text-xs text-[#1B3022]/40 font-medium text-right py-4 px-6">{"ステータス"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.filter(u => u.referrals >= 10).map((user) => {
                const highestTier = [...FIXED_TIERS]
                  .filter(t => user.referrals >= t.requiredReferrals)
                  .sort((a, b) => b.requiredReferrals - a.requiredReferrals)[0]

                if (!highestTier) return null

                const matchingReward = rewards.find(r => r.requiredReferrals === highestTier.requiredReferrals)

                return (
                  <TableRow key={user.id} className="hover:bg-[#1B3022]/2 border-b border-[#1B3022]/5">
                    <TableCell className="py-4 px-6">
                      <p className="text-sm font-medium text-[#1B3022]">{user.name}</p>
                      <p className="text-[10px] text-[#1B3022]/30">{`${user.referrals}名招待`}</p>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Gift className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="text-xs text-[#1B3022]/60">
                          {matchingReward?.title || highestTier.label}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4 px-6">
                      <Badge className="bg-[#1B3022]/10 text-[#1B3022] hover:bg-[#1B3022]/10 text-[10px]">
                        {"付与待機中"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
