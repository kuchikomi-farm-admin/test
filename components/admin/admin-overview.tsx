"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Users, UserPlus, Activity, TrendingUp, FileText, RotateCcw } from "lucide-react"
import { useAdminStore } from "@/lib/store/use-admin-store"
import { useContentStore } from "@/lib/store/use-content-store"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

// Local data removed - using stores below

export function AdminOverview() {
  const { stats: userStats, growthData: storeGrowthData, weeklyData: storeWeeklyData } = useAdminStore()
  const { contents } = useContentStore()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const displayStats = [
    { label: "総登録者数", value: userStats.totalUsers.toLocaleString(), change: "+31%", icon: Users },
    { label: "今月の新規登録", value: userStats.monthlyNewUsers.toLocaleString(), change: "+18%", icon: UserPlus },
    { label: "アクティブ率", value: `${userStats.activeRate}%`, change: "+5.4%", icon: Activity },
    { label: "総コンテンツ数", value: contents.length.toString(), change: "+12%", icon: FileText },
  ]

  const handleReset = () => {
    localStorage.removeItem("junkan-user-storage")
    localStorage.removeItem("junkan-content-storage")
    localStorage.removeItem("junkan-admin-storage")
    localStorage.removeItem("junkan-admin-user-storage")
    localStorage.removeItem("junkan-reward-storage")
    localStorage.removeItem("junkan-broadcast-storage")
    window.location.reload()
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {displayStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="p-5 rounded-xl border border-[#1B3022]/8 bg-background">
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-full font-medium">
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-serif text-[#1B3022]">{stat.value}</p>
              <p className="text-xs text-[#1B3022]/40 mt-1">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Growth Chart */}
      <div className="rounded-xl border border-[#1B3022]/8 bg-background p-6">
        <div className="mb-6">
          <h3 className="font-serif text-lg text-[#1B3022]">{"登録者数推移"}</h3>
          <p className="text-xs text-[#1B3022]/40 mt-1">{"招待による増加推移を含む月次データ"}</p>
        </div>
        <ChartContainer
          config={{
            total: { label: "総登録者数", color: "#1B3022" },
            invited: { label: "招待経由", color: "#D4AF37" },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={storeGrowthData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B302210" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#1B302240" />
              <YAxis tick={{ fontSize: 12 }} stroke="#1B302240" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#1B3022"
                fill="#1B302215"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="invited"
                stroke="#D4AF37"
                fill="#D4AF3715"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Weekly Registrations */}
      <div className="rounded-xl border border-[#1B3022]/8 bg-background p-6">
        <div className="mb-6">
          <h3 className="font-serif text-lg text-[#1B3022]">{"今週の登録数"}</h3>
          <p className="text-xs text-[#1B3022]/40 mt-1">{"日別の新規登録数"}</p>
        </div>
        <ChartContainer
          config={{
            registrations: { label: "新規登録", color: "#D4AF37" },
          }}
          className="h-[200px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={storeWeeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B302210" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#1B302240" />
              <YAxis tick={{ fontSize: 12 }} stroke="#1B302240" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="registrations" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Reset Section */}
      <div className="pt-8 border-t border-[#1B3022]/8">
        <div className="flex items-center justify-between p-6 rounded-xl bg-red-50/50 border border-red-100">
          <div>
            <h4 className="text-sm font-medium text-red-900">{"データの初期化"}</h4>
            <p className="text-xs text-red-700/60 mt-1">{"全ての登録データ、コンテンツ、統計情報を初期状態に戻します。"}</p>
          </div>
          <Button
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-100/50 gap-2"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4" />
            {"データをリセット"}
          </Button>
        </div>
      </div>
    </div>
  )
}
