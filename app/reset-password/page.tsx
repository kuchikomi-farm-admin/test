"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, KeyRound } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { passwordSchema } from "@/lib/validations/auth"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // バリデーション
    const parsed = passwordSchema.safeParse(newPassword)
    if (!parsed.success) {
      setError(parsed.error.errors[0].message)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("パスワードが一致しません")
      return
    }

    setIsSubmitting(true)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setError("パスワードの更新に失敗しました。リンクの有効期限が切れている可能性があります")
      setIsSubmitting(false)
      return
    }

    // ログアウトしてからリダイレクト（新パスワードで再ログインさせる）
    await supabase.auth.signOut()
    router.push("/?message=" + encodeURIComponent("パスワードが再設定されました。新しいパスワードでログインしてください"))
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

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5">
              <KeyRound className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <p className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase">
              {"New Password"}
            </p>
            <p className="text-[#F8F9FA]/70 text-sm font-light">
              {"新しいパスワードを設定してください"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-xs tracking-widest uppercase text-[#F8F9FA]/50">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              <p className="text-[10px] text-[#F8F9FA]/30">
                {"8文字以上、英字と数字をそれぞれ1文字以上含む"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs tracking-widest uppercase text-[#F8F9FA]/50">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 bg-[#F8F9FA]/5 border-[#F8F9FA]/10 text-[#F8F9FA] placeholder:text-[#F8F9FA]/25 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F8F9FA]/30 hover:text-[#F8F9FA]/60 transition-colors"
                  aria-label={showConfirm ? "パスワードを隠す" : "パスワードを表示する"}
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !newPassword || !confirmPassword}
              className="w-full h-12 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B3022] font-medium tracking-wider"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#1B3022]/30 border-t-[#1B3022] rounded-full animate-spin" />
                  {"更新中..."}
                </span>
              ) : (
                "パスワードを再設定"
              )}
            </Button>
          </form>
        </div>

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
