"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { AdminOverview } from "@/components/admin/admin-overview"
import { AdminUsers } from "@/components/admin/admin-users"
import { AdminRewards } from "@/components/admin/admin-rewards"
import { AdminBroadcast } from "@/components/admin/admin-broadcast"
import { AdminContent } from "@/components/admin/admin-content"
import { cn } from "@/lib/utils"
import { BarChart3, Users, Gift, Send, FileText } from "lucide-react"

const tabs = [
  { id: "overview", label: "全体統計", icon: BarChart3, disabled: false },
  { id: "content", label: "コンテンツ管理", icon: FileText, disabled: false },
  { id: "users", label: "ユーザー管理", icon: Users, disabled: false },
  { id: "rewards", label: "特典管理", icon: Gift, disabled: false },
  { id: "broadcast", label: "配信管理", icon: Send, disabled: true },
] as const

type TabId = (typeof tabs)[number]["id"]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview")

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <AppHeader isAdmin />

      <div className="mx-auto max-w-[1400px] px-4 md:px-8 lg:px-12 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-[#1B3022]/40 tracking-wider uppercase">{"Admin Dashboard"}</p>
          <h1 className="font-serif text-2xl text-[#1B3022] mt-1">{"管理者ダッシュボード"}</h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors",
                  tab.disabled
                    ? "text-[#1B3022]/20 cursor-not-allowed"
                    : activeTab === tab.id
                      ? "bg-[#1B3022] text-[#D4AF37]"
                      : "text-[#1B3022]/50 hover:text-[#1B3022] hover:bg-[#1B3022]/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.disabled && <span className="text-[10px] ml-1 opacity-60">{"(開発中)"}</span>}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && <AdminOverview />}
        {activeTab === "content" && <AdminContent />}
        {activeTab === "users" && <AdminUsers />}
        {activeTab === "rewards" && <AdminRewards />}
        {activeTab === "broadcast" && <AdminBroadcast />}
      </div>
    </div>
  )
}
