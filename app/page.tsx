"use client"

import React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react"

export default function GatewayPage() {
  const [mode, setMode] = useState<"gate" | "login">("gate")
  const [inviteCode, setInviteCode] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsValidating(true)
    setTimeout(() => {
      setIsValidating(false)
      setMode("login")
    }, 1200)
  }

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    window.location.href = "/feed"
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-gateway.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[#1B3022]/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B3022] via-transparent to-[#1B3022]/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl tracking-wider text-[#F8F9FA]">
            JUNKAN
          </h1>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-[#D4AF37]" />
            <p className="text-xs tracking-[0.3em] uppercase text-[#D4AF37]">
              {"Trusted Circle"}
            </p>
            <span className="h-px w-8 bg-[#D4AF37]" />
          </div>
        </div>

        {mode === "gate" ? (
          /* Invitation Gate */
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5">
                <Lock className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <p className="text-[#F8F9FA]/90 text-sm leading-relaxed font-light">
                {"招待コードをお持ちの方のみ"}
                <br />
                {"入場いただけます"}
              </p>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="invite-code" className="text-xs tracking-widest uppercase text-[#F8F9FA]/50">
                  Invitation Code
                </Label>
                <Input
                  id="invite-code"
                  type="text"
                  placeholder="XXXX-XXXX-XXXX"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="h-12 bg-[#F8F9FA]/5 border-[#F8F9FA]/10 text-[#F8F9FA] placeholder:text-[#F8F9FA]/25 text-center tracking-[0.2em] text-lg focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isValidating || !inviteCode}
                className="w-full h-12 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B3022] font-medium tracking-wider"
              >
                {isValidating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#1B3022]/30 border-t-[#1B3022] rounded-full animate-spin" />
                    {"認証中..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {"入場する"}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            <p className="text-center text-xs text-[#F8F9FA]/30">
              {"招待コードは既存会員からのみ発行されます"}
            </p>
          </div>
        ) : (
          /* Login Form */
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <p className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase">
                {"Welcome Back"}
              </p>
              <p className="text-[#F8F9FA]/70 text-sm font-light">
                {"アカウントにログインしてください"}
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs tracking-widest uppercase text-[#F8F9FA]/50">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-[#F8F9FA]/5 border-[#F8F9FA]/10 text-[#F8F9FA] placeholder:text-[#F8F9FA]/25 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs tracking-widest uppercase text-[#F8F9FA]/50">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-[#F8F9FA]/5 border-[#F8F9FA]/10 text-[#F8F9FA] placeholder:text-[#F8F9FA]/25 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F8F9FA]/30 hover:text-[#F8F9FA]/60 transition-colors"
                    aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示する"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B3022] font-medium tracking-wider"
              >
                {"ログイン"}
              </Button>
            </form>

            <div className="flex items-center justify-between text-xs text-[#F8F9FA]/40">
              <button
                type="button"
                onClick={() => setMode("gate")}
                className="hover:text-[#D4AF37] transition-colors"
              >
                {"招待コード入力に戻る"}
              </button>
              <Link href="/register" className="hover:text-[#D4AF37] transition-colors">
                {"新規登録"}
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-[10px] text-[#F8F9FA]/20 tracking-wider">
            {"JUNKAN 2026 All rights reserved."}
          </p>
        </div>
      </div>
    </div>
  )
}
