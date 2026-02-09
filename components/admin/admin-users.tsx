"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, ArrowUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAdminUserStore } from "@/lib/store/use-admin-user-store"

export function AdminUsers() {
  const { users, updateUserStatus } = useAdminUserStore()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<"referrals" | "clicks" | "registrations">("referrals")
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const filtered = users
    .filter((u) => u.name.includes(searchQuery) || u.email.includes(searchQuery))
    .sort((a, b) => b[sortField] - a[sortField])

  const handleToggleStatus = async (id: string, currentStatus: "active" | "pending") => {
    setLoadingId(id)
    await new Promise(resolve => setTimeout(resolve, 600))
    const newStatus = currentStatus === "active" ? "pending" : "active"
    updateUserStatus(id, newStatus)
    setLoadingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1B3022]/30" />
        <Input
          placeholder="名前またはメールで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 bg-background border-[#1B3022]/10 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20"
        />
      </div>

      {/* Sort buttons */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#1B3022]/40">{"並び替え:"}</span>
        {[
          { field: "referrals" as const, label: "紹介数" },
          { field: "clicks" as const, label: "クリック数" },
          { field: "registrations" as const, label: "登録数" },
        ].map((s) => (
          <button
            key={s.field}
            type="button"
            onClick={() => setSortField(s.field)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1",
              sortField === s.field
                ? "bg-[#1B3022] text-[#D4AF37]"
                : "text-[#1B3022]/40 hover:bg-[#1B3022]/5"
            )}
          >
            <ArrowUpDown className="w-3 h-3" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#1B3022]/8 bg-background overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-[#1B3022]/8">
              <TableHead className="text-xs text-[#1B3022]/40 font-medium py-4 px-6">{"ユーザー"}</TableHead>
              <TableHead className="text-xs text-[#1B3022]/40 font-medium text-right py-4 px-6">{"紹介数"}</TableHead>
              <TableHead className="text-xs text-[#1B3022]/40 font-medium text-right py-4 px-6 hidden md:table-cell">{"クリック数"}</TableHead>
              <TableHead className="text-xs text-[#1B3022]/40 font-medium text-right py-4 px-6 hidden md:table-cell">{"登録完了"}</TableHead>
              <TableHead className="text-xs text-[#1B3022]/40 font-medium text-right py-4 px-6">{"操作"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id} className="hover:bg-[#1B3022]/2 border-b border-[#1B3022]/5 last:border-0">
                <TableCell className="py-4 px-6">
                  <div>
                    <p className="text-sm font-medium text-[#1B3022]">{user.name}</p>
                    <p className="text-xs text-[#1B3022]/30">{user.email}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right py-4 px-6">
                  <span className="font-serif text-[#1B3022]">{user.referrals}</span>
                </TableCell>
                <TableCell className="text-right py-4 px-6 hidden md:table-cell">
                  <span className="text-sm text-[#1B3022]/60">{user.clicks}</span>
                </TableCell>
                <TableCell className="text-right py-4 px-6 hidden md:table-cell">
                  <span className="text-sm text-[#1B3022]/60">{user.registrations}</span>
                </TableCell>
                <TableCell className="text-right py-4 px-6">
                  <button
                    onClick={() => handleToggleStatus(user.id, user.status)}
                    disabled={loadingId === user.id}
                    className="inline-flex"
                  >
                    {loadingId === user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                    ) : (
                      <Badge
                        variant={user.status === "active" ? "default" : "secondary"}
                        className={cn(
                          "cursor-pointer transition-all hover:scale-105",
                          user.status === "active"
                            ? "bg-[#1B3022]/10 text-[#1B3022] hover:bg-[#1B3022]/10"
                            : "bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        )}
                      >
                        {user.status === "active" ? "承認済み" : "承認待ち"}
                      </Badge>
                    )}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
