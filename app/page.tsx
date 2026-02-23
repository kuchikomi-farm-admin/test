"use client"

import React, { Suspense } from "react"

import { useState } from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, ArrowLeft, Info, Mail } from "lucide-react"
import { signIn, requestPasswordReset } from "@/app/actions/auth"

export default function GatewayPage() {
  return (
    <Suspense>
      <GatewayContent />
    </Suspense>
  )
}

function GatewayContent() {
  const searchParams = useSearchParams()
  const callbackMessage = searchParams.get("message")
  const [mode, setMode] = useState<"login" | "reset">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [error, setError] = useState("")

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoggingIn(true)

    const result = await signIn({ email, password })

    // signIn redirects on success, so we only reach here on error
    if (result?.error) {
      setError(result.error)
      setIsLoggingIn(false)
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsResetting(true)

    const result = await requestPasswordReset(resetEmail)

    setIsResetting(false)
    if (result?.error) {
      setError(result.error)
      return
    }

    setResetSent(true)
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
        <div className="text-center mb-12 -mx-6">
          <h1 className="font-serif text-4xl md:text-5xl tracking-wider text-[#F8F9FA] whitespace-nowrap">
            TheJapanLocalMedia
          </h1>
        </div>

        {/* Callback Message (from email verification) */}
        {callbackMessage && !error && (
          <div className="mb-6 p-4 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Info className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-sm text-[#F8F9FA]/80">{callbackMessage}</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {mode === "login" ? (
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
                disabled={isLoggingIn}
                className="w-full h-12 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B3022] font-medium tracking-wider"
              >
                {isLoggingIn ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#1B3022]/30 border-t-[#1B3022] rounded-full animate-spin" />
                    {"ログイン中..."}
                  </span>
                ) : (
                  "ログイン"
                )}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setMode("reset"); setError(""); setResetSent(false); setResetEmail(email) }}
                className="text-xs text-[#F8F9FA]/40 hover:text-[#D4AF37] transition-colors"
              >
                {"パスワードをお忘れの方"}
              </button>
            </div>

            <p className="text-center text-xs text-[#F8F9FA]/30">
              {"新規登録は招待リンクからのみ可能です"}
            </p>
          </div>
        ) : (
          /* Password Reset Form */
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5">
                <Mail className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <p className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase">
                {"Password Reset"}
              </p>
              <p className="text-[#F8F9FA]/70 text-sm font-light">
                {"パスワード再設定用のメールをお送りします"}
              </p>
            </div>

            {resetSent ? (
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-center space-y-2">
                  <p className="text-sm text-[#F8F9FA]/90">
                    {"パスワード再設定用のメールを送信しました"}
                  </p>
                  <p className="text-xs text-[#F8F9FA]/60">
                    {"メールが届かない場合は迷惑メールフォルダをご確認ください"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); setResetSent(false) }}
                  className="flex items-center justify-center gap-2 w-full text-xs text-[#D4AF37]/70 hover:text-[#D4AF37] transition-colors tracking-wider"
                >
                  <ArrowLeft className="w-3 h-3" />
                  {"ログインに戻る"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-xs tracking-widest uppercase text-[#F8F9FA]/50">
                    Email
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="h-12 bg-[#F8F9FA]/5 border-[#F8F9FA]/10 text-[#F8F9FA] placeholder:text-[#F8F9FA]/25 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isResetting || !resetEmail}
                  className="w-full h-12 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B3022] font-medium tracking-wider"
                >
                  {isResetting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#1B3022]/30 border-t-[#1B3022] rounded-full animate-spin" />
                      {"送信中..."}
                    </span>
                  ) : (
                    "リセットメールを送信"
                  )}
                </Button>
              </form>
            )}

            {!resetSent && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError("") }}
                  className="flex items-center justify-center gap-2 w-full text-xs text-[#F8F9FA]/40 hover:text-[#D4AF37] transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  {"ログインに戻る"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-[10px] text-[#F8F9FA]/20 tracking-wider">
            {"TheJapanLocalMedia 2026 All rights reserved."}
          </p>
        </div>
      </div>
    </div>
  )
}
