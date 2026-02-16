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
import { Users, UserPlus, Activity, FileText } from "lucide-react"
import { useState, useEffect } from "react"
import { getDashboardStats } from "@/app/actions/admin"

interface DashboardData {
  stats: { totalUsers: number; activeRate: number; monthlyNewUsers: number; contentCount: number }
  growthData: { month: string; total: number; invited: number }[]
  weeklyData: { day: string; registrations: number }[]
}

export function AdminOverview() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    getDashboardStats()
      .then((result) => setData(result))
      .catch(() => {})
  }, [])

  if (!mounted || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#1B3022]/40">読み込み中...</p>
      </div>
    )
  }

  const displayStats = [
    { label: "総登録者数", value: data.stats.totalUsers.toLocaleString(), icon: Users },
    { label: "今月の新規登録", value: data.stats.monthlyNewUsers.toLocaleString(), icon: UserPlus },
    { label: "アクティブ率", value: `${data.stats.activeRate}%`, icon: Activity },
    { label: "総コンテンツ数", value: data.stats.contentCount.toString(), icon: FileText },
  ]

  return (
    <div className="space-y-8 pb-12">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {displayStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="p-6 rounded-xl border border-[#1B3022]/8 bg-background">
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <p className="text-2xl font-serif text-[#1B3022]">{stat.value}</p>
              <p className="text-xs text-[#1B3022]/40 mt-1">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <div className="rounded-xl border border-[#1B3022]/8 bg-background p-6">
          <div className="mb-6">
            <h3 className="font-serif text-lg text-[#1B3022]">{"登録者数推移"}</h3>
            <p className="text-xs text-[#1B3022]/40 mt-1">{"月別の累計登録者数"}</p>
          </div>
          <ChartContainer
            config={{
              total: { label: "総登録者数", color: "#1B3022" },
              invited: { label: "招待経由", color: "#D4AF37" },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.growthData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
            className="h-[280px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1B302210" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#1B302240" />
                <YAxis tick={{ fontSize: 12 }} stroke="#1B302240" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="registrations" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

    </div>
  )
}
