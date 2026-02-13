"use client"

import Link from "next/link"
import { useUserStore } from "@/lib/store/use-user-store"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Menu, X, Home, User, LogOut, Settings, ChevronDown, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut } from "@/app/actions/auth"

const memberNavItems = [
  { href: "/feed", label: "ホーム", icon: Home },
  { href: "/mypage", label: "マイページ", icon: User },
]

const adminNavItem = { href: "/admin", label: "管理者", icon: Settings }

export function AppHeader() {
  const { user, isLoading } = useUserStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isAdmin = user?.role === "admin"
  const navItems = isAdmin
    ? [...memberNavItems, adminNavItem]
    : memberNavItems

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await signOut()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#1B3022]/10 bg-[#F8F9FA]/95 backdrop-blur-md">
      <div className="mx-auto max-w-6xl flex items-center justify-between h-14 px-4 md:px-6">
        <Link href="/feed" className="font-serif text-xl tracking-wider text-[#1B3022]">
          TheJapanLocalMedia
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-[#1B3022] text-[#D4AF37]"
                    : "text-[#1B3022]/60 hover:text-[#1B3022] hover:bg-[#1B3022]/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop user menu */}
        <div className="hidden md:flex items-center gap-2 relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#1B3022]/60 hover:text-[#1B3022] hover:bg-[#1B3022]/5 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#1B3022]/10 flex items-center justify-center">
              <span className="text-xs font-medium text-[#1B3022]/70">
                {mounted && user?.name ? user.name[0] : "•"}
              </span>
            </div>
            <span className="text-xs text-[#1B3022]/50">
              {mounted && user ? user.name : "Loading..."}
            </span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-[#1B3022]/30 transition-transform", userMenuOpen && "rotate-180")} />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-[#1B3022]/10 bg-[#F8F9FA] shadow-lg py-1.5">
                <div className="px-4 py-2.5 border-b border-[#1B3022]/8">
                  <p className="text-sm font-medium text-[#1B3022]">
                    {user?.name || "Guest"}
                  </p>
                  <p className="text-xs text-[#1B3022]/40">
                    {user?.email || ""}
                  </p>
                  <p className="text-[10px] text-[#D4AF37] mt-1">
                    {`会員No. ${user?.memberId || "---"}`}
                  </p>
                </div>
                <Link
                  href="/favorites"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1B3022]/70 hover:text-[#1B3022] hover:bg-[#1B3022]/5 transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  {"いいね / 保存済み"}
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1B3022]/70 hover:text-[#1B3022] hover:bg-[#1B3022]/5 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  {"アカウント設定"}
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1B3022]/70 hover:text-[#1B3022] hover:bg-[#1B3022]/5 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" /></svg>
                    {"管理者ダッシュボード"}
                  </Link>
                )}
                <div className="border-t border-[#1B3022]/8 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1B3022]/40 hover:text-[#1B3022]/70 transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    {"ログアウト"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-[#1B3022]/70"
          aria-label={mobileOpen ? "メニューを閉じる" : "メニューを開く"}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#1B3022]/10 bg-[#F8F9FA] px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-[#1B3022] text-[#D4AF37]"
                    : "text-[#1B3022]/60 hover:bg-[#1B3022]/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
          <div className="pt-2 border-t border-[#1B3022]/10 mt-2 space-y-1">
            <Link
              href="/favorites"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#1B3022]/60 hover:bg-[#1B3022]/5"
            >
              <Heart className="w-4 h-4" />
              {"いいね / 保存済み"}
            </Link>
            <Link
              href="/settings"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#1B3022]/60 hover:bg-[#1B3022]/5"
            >
              <Settings className="w-4 h-4" />
              {"アカウント設定"}
            </Link>
            <button
              type="button"
              onClick={() => { setMobileOpen(false); handleLogout() }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#1B3022]/40 hover:text-[#1B3022]/70 w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              {"ログアウト"}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
