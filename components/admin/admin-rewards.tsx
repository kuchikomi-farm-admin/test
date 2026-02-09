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
import { Gift, Star, Crown, Check, Clock, Plus, Trash2, Package } from "lucide-react"
import { useRewardStore } from "@/lib/store/use-reward-store"
import { useAdminUserStore } from "@/lib/store/use-admin-user-store"
import { cn } from "@/lib/utils"

export function AdminRewards() {
  const { rewards, addReward, deleteReward } = useRewardStore()
  const { users } = useAdminUserStore()
  const [mounted, setMounted] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  // Form State
  const [newTitle, setNewTitle] = useState("")
  const [newReferrals, setNewReferrals] = useState(5)
  const [newDesc, setNewDesc] = useState("")

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const handleAddReward = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newDesc) return

    addReward({
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle,
      requiredReferrals: newReferrals,
      description: newDesc,
      icon: "Gift", // Default icon for now
      status: "active"
    })

    setNewTitle("")
    setNewDesc("")
    setNewReferrals(5)
    setShowAddForm(false)
  }

  // Calculate stats
  const rewardStats = rewards.map(reward => ({
    ...reward,
    achievedCount: users.filter(u => u.referrals >= reward.requiredReferrals).length
  }))

  return (
    <div className="space-y-8">
      {/* Reward Definitions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif text-[#1B3022]">{"特典マスター管理"}</h2>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-[#1B3022] text-[#D4AF37] hover:bg-[#1B3022]/90 gap-2"
          >
            <Plus className="w-4 h-4" />
            {"特典を追加"}
          </Button>
        </div>

        {showAddForm && (
          <div className="p-6 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 space-y-4 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-sm font-medium text-[#1B3022]">{"新規特典の登録"}</h3>
            <form onSubmit={handleAddReward} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] text-[#1B3022]/40 uppercase tracking-wider">{"特典名"}</label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="例：限定ステッカー" className="bg-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#1B3022]/40 uppercase tracking-wider">{"必要紹介数"}</label>
                <Input type="number" value={newReferrals} onChange={e => setNewReferrals(parseInt(e.target.value))} className="bg-white" />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full bg-[#1B3022] text-[#D4AF37]">{"保存"}</Button>
              </div>
              <div className="space-y-1.5 md:col-span-4">
                <label className="text-[10px] text-[#1B3022]/40 uppercase tracking-wider">{"説明文"}</label>
                <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="特典の条件や内容を記述してください" className="bg-white" />
              </div>
            </form>
          </div>
        )}

        <div className="rounded-xl border border-[#1B3022]/8 bg-background overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-[#1B3022]/8">
                <TableHead className="text-xs text-[#1B3022]/40 font-medium py-4 px-6">{"対象特典"}</TableHead>
                <TableHead className="text-xs text-[#1B3022]/40 font-medium text-center py-4 px-6">{"条件"}</TableHead>
                <TableHead className="text-xs text-[#1B3022]/40 font-medium text-center py-4 px-6">{"達成者数"}</TableHead>
                <TableHead className="text-xs text-[#1B3022]/40 font-medium text-right py-4 px-6">{"操作"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rewardStats.map((reward) => (
                <TableRow key={reward.id} className="hover:bg-[#1B3022]/2 border-b border-[#1B3022]/5">
                  <TableCell className="py-4 px-6">
                    <div>
                      <p className="text-sm font-medium text-[#1B3022]">{reward.title}</p>
                      <p className="text-xs text-[#1B3022]/40">{reward.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-4 px-6">
                    <Badge variant="outline" className="border-[#1B3022]/10 text-[#1B3022]/60">
                      {`${reward.requiredReferrals}名招待`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-4 px-6">
                    <span className="font-serif text-[#1B3022]">{reward.achievedCount}</span>
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteReward(reward.id)}
                      className="text-[#E5484D] hover:text-[#E5484D] hover:bg-[#E5484D]/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
              {users.filter(u => u.referrals >= Math.min(...rewards.map(r => r.requiredReferrals))).map((user) => {
                const highestReward = [...rewards]
                  .filter(r => user.referrals >= r.requiredReferrals)
                  .sort((a, b) => b.requiredReferrals - a.requiredReferrals)[0]

                if (!highestReward) return null

                return (
                  <TableRow key={user.id} className="hover:bg-[#1B3022]/2 border-b border-[#1B3022]/5">
                    <TableCell className="py-4 px-6">
                      <p className="text-sm font-medium text-[#1B3022]">{user.name}</p>
                      <p className="text-[10px] text-[#1B3022]/30">{`${user.referrals}名招待`}</p>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Gift className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="text-xs text-[#1B3022]/60">{highestReward.title}</span>
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
