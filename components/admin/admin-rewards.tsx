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
import { cn } from "@/lib/utils"
import { getAdminRewards, updateAdminReward } from "@/app/actions/admin"

const TIER_ICONS: Record<number, { icon: typeof Gift; color: string }> = {
  10: { icon: Gift, color: "bg-[#D4AF37]/20 text-[#D4AF37]" },
  100: { icon: Star, color: "bg-[#D4AF37]/30 text-[#D4AF37]" },
  1000: { icon: Crown, color: "bg-[#D4AF37]/40 text-[#D4AF37]" },
}

interface RewardData {
  id: string
  title: string
  description: string
  requiredReferrals: number
  icon: string
  status: string
  achievedCount: number
}

interface AchieverData {
  id: string
  name: string
  referrals: number
}

export function AdminRewards() {
  const [mounted, setMounted] = useState(false)
  const [rewards, setRewards] = useState<RewardData[]>([])
  const [achievers, setAchievers] = useState<AchieverData[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMounted(true)
    getAdminRewards()
      .then((result) => {
        if ("rewards" in result) {
          setRewards(result.rewards)
          setAchievers(result.achievers)
        }
      })
      .catch(() => {})
  }, [])

  if (!mounted) return null

  if (rewards.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#1B3022]/40">読み込み中...</p>
      </div>
    )
  }

  const handleStartEdit = (reward: RewardData) => {
    setEditingId(reward.id)
    setEditTitle(reward.title)
    setEditDesc(reward.description)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editTitle) return
    setSaving(true)
    const result = await updateAdminReward(id, editTitle, editDesc)
    if (!("error" in result)) {
      setRewards((prev) =>
        prev.map((r) => (r.id === id ? { ...r, title: editTitle, description: editDesc } : r))
      )
    }
    setSaving(false)
    setEditingId(null)
  }

  return (
    <div className="space-y-8">
      {/* Tier Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif text-[#1B3022]">{"報酬ロードマップ管理"}</h2>
        <p className="text-xs text-[#1B3022]/40">{"3段階の固定マイルストーン（10人 / 100人 / 1000人）の内容を編集できます。"}</p>

        <div className="space-y-4">
          {rewards.map((reward) => {
            const tierConfig = TIER_ICONS[reward.requiredReferrals] || { icon: Gift, color: "bg-[#D4AF37]/20 text-[#D4AF37]" }
            const Icon = tierConfig.icon
            const isEditing = editingId === reward.id

            return (
              <div
                key={reward.id}
                className="rounded-xl border border-[#1B3022]/8 bg-background p-5 space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("shrink-0 w-12 h-12 rounded-full flex items-center justify-center", tierConfig.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-medium text-[#1B3022]">{`${reward.requiredReferrals}人達成`}</h3>
                      <Badge variant="outline" className="border-[#1B3022]/10 text-[#1B3022]/60">
                        {`${reward.requiredReferrals}名招待`}
                      </Badge>
                    </div>
                    {!isEditing && (
                      <div className="mt-1.5">
                        <p className="text-sm text-[#1B3022]/80">{reward.title}</p>
                        <p className="text-xs text-[#1B3022]/40 mt-0.5">{reward.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-lg font-serif text-[#1B3022]">{reward.achievedCount}</p>
                      <p className="text-[10px] text-[#1B3022]/40">{"達成者"}</p>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStartEdit(reward)}
                        className="text-[#1B3022]/40 hover:text-[#1B3022]"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Inline edit form */}
                {isEditing && (
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
                        onClick={() => handleSaveEdit(reward.id)}
                        disabled={saving}
                        className="bg-[#1B3022] text-[#D4AF37]"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        {saving ? "保存中..." : "保存"}
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
              {achievers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-sm text-[#1B3022]/30">
                    {"達成者はまだいません"}
                  </TableCell>
                </TableRow>
              ) : (
                achievers.map((user) => {
                  const highestTier = [1000, 100, 10].find((t) => user.referrals >= t)
                  const tierConfig = highestTier ? TIER_ICONS[highestTier] : null
                  const matchingReward = rewards.find((r) => r.requiredReferrals === highestTier)

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
                            {matchingReward?.title || `${highestTier}人達成`}
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
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
