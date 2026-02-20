"use client"

import React, { Suspense } from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Info, Mail } from "lucide-react"
import { verifyInviteCode, signIn, requestPasswordReset } from "@/app/actions/auth"
import { createClient } from "@/lib/supabase/client"

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
  const [mode, setMode] = useState<"gate" | "login" | "reset">("gate")
  const [inviteCode, setInviteCode] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [referrerName, setReferrerName] = useState("")

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsValidating(true)

    const result = await verifyInviteCode(inviteCode)

    setIsValidating(false)
    if (!result.valid) {
      setError("招待コードが無効または使用済みです")
      return
    }

    if (result.referrer_name) {
      setReferrerName(result.referrer_name)
    }
    setMode("login")
  }

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

  const handleGoogleLogin = async () => {
    setError("")
    setIsGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError("Google認証に失敗しました")
      setIsGoogleLoading(false)
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
              <div className="space-y-2 text-center">
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

            <div className="text-center pt-4 border-t border-[#F8F9FA]/10">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-xs text-[#D4AF37]/70 hover:text-[#D4AF37] transition-colors tracking-wider"
              >
                {"既に会員の方はこちらからログイン"}
              </button>
            </div>
          </div>
        ) : mode === "login" ? (
          /* Login Form */
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <p className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase">
                {"Welcome Back"}
              </p>
              <p className="text-[#F8F9FA]/70 text-sm font-light">
                {"アカウントにログインしてください"}
              </p>
              {referrerName && (
                <p className="text-[#F8F9FA]/50 text-xs mt-1">
                  {`${referrerName} さんからの招待で認証済み`}
                </p>
              )}
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

            {/* Google Login */}
            <div className="flex items-center gap-3">
              <span className="flex-1 h-px bg-[#F8F9FA]/10" />
              <span className="text-xs text-[#F8F9FA]/30">or</span>
              <span className="flex-1 h-px bg-[#F8F9FA]/10" />
            </div>

            <button
              type="button"
              disabled
              className="w-full h-12 flex items-center justify-center gap-3 rounded-md bg-white/30 text-[#F8F9FA]/40 font-medium tracking-wider cursor-not-allowed"
            >
              <svg className="w-5 h-5 opacity-40" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {"Googleでログイン（準備中）"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setMode("reset"); setError(""); setResetSent(false); setResetEmail(email) }}
                className="text-xs text-[#F8F9FA]/40 hover:text-[#D4AF37] transition-colors"
              >
                {"パスワードをお忘れの方"}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-[#F8F9FA]/40">
              <button
                type="button"
                onClick={() => { setMode("gate"); setError("") }}
                className="hover:text-[#D4AF37] transition-colors"
              >
                {"招待コード入力に戻る"}
              </button>
              <Link
                href={`/register${inviteCode ? `?code=${encodeURIComponent(inviteCode)}` : ""}`}
                className="hover:text-[#D4AF37] transition-colors"
              >
                {"新規登録"}
              </Link>
            </div>
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
