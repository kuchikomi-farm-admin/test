"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Send, Mail, MessageSquare, Clock, Check, Calendar, Loader2 } from "lucide-react"
import { useBroadcastStore } from "@/lib/store/use-broadcast-store"
import { useAdminUserStore } from "@/lib/store/use-admin-user-store"
import { cn } from "@/lib/utils"

export function AdminBroadcast() {
  const { broadcasts, sendBroadcast } = useBroadcastStore()
  const { users } = useAdminUserStore()
  const [mounted, setMounted] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Form State
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [targetRank, setTargetRank] = useState<any>("all")

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !body) return

    setIsSending(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    const now = new Date()
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    sendBroadcast({
      id: Math.random().toString(36).substr(2, 9),
      title,
      body,
      targetRank,
      sentAt: formattedDate,
      status: "sent"
    })

    setTitle("")
    setBody("")
    setIsSending(false)
  }

  return (
    <div className="space-y-8">
      {/* New Broadcast Form */}
      <div className="rounded-xl border border-[#1B3022]/8 bg-background p-6 space-y-5">
        <h3 className="font-serif text-lg text-[#1B3022]">{"新規配信作成"}</h3>

        <form onSubmit={handleSend} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-[#1B3022]/50 uppercase tracking-wider">{"配信対象ランク"}</Label>
              <Select value={targetRank} onValueChange={setTargetRank}>
                <SelectTrigger className="h-11 border-[#1B3022]/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{"全ユーザー"}</SelectItem>
                  <SelectItem value="premium">{"プレミアム会員のみ"}</SelectItem>
                  <SelectItem value="platinum">{"プラチナ会員のみ"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-[#1B3022]/50 uppercase tracking-wider">{"想定配信数"}</Label>
              <div className="h-11 flex items-center px-4 rounded-md bg-[#1B3022]/5 text-sm text-[#1B3022]">
                {targetRank === "all" ? `${users.length} 名` : `${Math.floor(users.length / 3)} 名 (推定)`}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-[#1B3022]/50 uppercase tracking-wider">{"タイトル"}</Label>
            <Input
              placeholder="配信タイトルを入力..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 border-[#1B3022]/10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-[#1B3022]/50 uppercase tracking-wider">{"本文"}</Label>
            <Textarea
              placeholder="配信内容を入力..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[120px] border-[#1B3022]/10 resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-[#1B3022]/5">
            <Button
              type="submit"
              disabled={isSending}
              className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B3022] gap-2 min-w-[140px]"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {"送信中..."}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {"即時配信する"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Broadcast History */}
      <div className="space-y-4">
        <h3 className="font-serif text-lg text-[#1B3022]">{"配信履歴"}</h3>

        <div className="space-y-3">
          {broadcasts.length === 0 && (
            <div className="py-20 text-center rounded-xl border border-dashed border-[#1B3022]/10">
              <Mail className="w-8 h-8 text-[#1B3022]/10 mx-auto mb-2" />
              <p className="text-sm text-[#1B3022]/30">{"配信履歴はありません"}</p>
            </div>
          )}
          {broadcasts.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-[#1B3022]/8 bg-background transition-all hover:border-[#D4AF37]/30"
            >
              <div className="shrink-0 w-10 h-10 rounded-full bg-[#1B3022]/5 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-[#1B3022]/40" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1B3022] truncate">{item.title}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-[#1B3022]/40 uppercase tracking-tight">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.sentAt}
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {item.targetRank === "all" ? "全ユーザー" : `${item.targetRank}会員`}
                  </span>
                </div>
              </div>

              <Badge
                className={cn(
                  "text-[10px] font-normal px-2 py-0",
                  item.status === "sent"
                    ? "bg-[#1B3022]/10 text-[#1B3022] hover:bg-[#1B3022]/10"
                    : "bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                )}
              >
                {item.status === "sent" ? "送信済" : item.status === "scheduled" ? "配信待ち" : "失敗"}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
