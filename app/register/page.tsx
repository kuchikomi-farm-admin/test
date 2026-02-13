"use client"

import React, { Suspense } from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Eye, EyeOff, UserPlus, CheckCircle2 } from "lucide-react"
import { signUp, verifyInviteCode } from "@/app/actions/auth"

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get("code") || ""

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    lastName: "",
    firstName: "",
    question: "",
    inviteCode: codeFromUrl,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState("")
  const [referrerName, setReferrerName] = useState("")

  // Verify invite code from URL on mount
  useEffect(() => {
    if (codeFromUrl) {
      verifyInviteCode(codeFromUrl).then((result) => {
        if (result.valid && result.referrer_name) {
          setReferrerName(result.referrer_name)
        }
      })
    }
  }, [codeFromUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    const result = await signUp({
      lastName: formData.lastName,
      firstName: formData.firstName,
      email: formData.email,
      password: formData.password,
      question: formData.question,
      inviteCode: formData.inviteCode,
    })

    setIsSubmitting(false)

    if (result && "error" in result && result.error) {
      setError(result.error)
      return
    }

    setIsComplete(true)
  }

  if (isComplete) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/hero-gateway.jpg" alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-[#1B3022]/85" />
        </div>
        <div className="relative z-10 text-center space-y-8 px-6 max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-[#D4AF37]/40 bg-[#D4AF37]/10">
            <CheckCircle2 className="w-10 h-10 text-[#D4AF37]" />
          </div>
          <div className="space-y-3">
            <h2 className="font-serif text-2xl text-[#F8F9FA]">{"ご登録ありがとうございます"}</h2>
            <p className="text-sm text-[#F8F9FA]/60 leading-relaxed">
              {"ご入力いただいたメールアドレスに認証メールをお送りしました。"}
              <br />
              {"メール内のリンクをクリックして認証を完了してください。"}
            </p>
            <p className="text-sm text-[#F8F9FA]/60 leading-relaxed">
              {"認証後、管理者による審査を経てアカウントが有効化されます。"}
              <br />
              {"通常1〜2営業日以内にご連絡差し上げます。"}
            </p>
            <div className="mt-4 p-3 rounded-lg bg-[#F8F9FA]/5 border border-[#F8F9FA]/10">
              <p className="text-xs text-[#F8F9FA]/50 leading-relaxed">
                {"メールが届かない場合は、迷惑メールフォルダもご確認ください。"}
                <br />
                {"それでも届かない場合は、しばらく待ってから再度お試しください。"}
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors tracking-wider"
          >
            {"トップページに戻る"}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden py-12">
      <div className="absolute inset-0">
        <Image src="/images/hero-gateway.jpg" alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-[#1B3022]/85" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <h1 className="font-serif text-3xl tracking-wider text-[#F8F9FA]">TheJapanLocalMedia</h1>
          </Link>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-[#D4AF37]" />
            <p className="text-xs tracking-[0.3em] uppercase text-[#D4AF37]">{"Member Registration"}</p>
            <span className="h-px w-8 bg-[#D4AF37]" />
          </div>
        </div>

        {/* Referrer Badge */}
        {referrerName && (
          <div className="mb-8 flex items-center justify-center gap-3 py-3 px-5 rounded-full bg-[#F8F9FA]/5 border border-[#F8F9FA]/10 w-fit mx-auto">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-sm text-[#F8F9FA]/70">
              <span className="text-[#D4AF37] font-medium">{referrerName}</span>
              {"  さんからの招待"}
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Invite Code (if not from URL) */}
          {!codeFromUrl && (
            <div className="space-y-2">
              <Label htmlFor="invite-code" className="text-xs tracking-widest uppercase text-[#F8F9FA]/50">
                {"招待コード"}
              </Label>
              <Input
                id="invite-code"
                type="text"
                placeholder="XXXX-XXXX-XXXX"
                value={formData.inviteCode}
                onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
                className="h-12 bg-[#F8F9FA]/5 border-[#F8F9FA]/10 text-[#F8F9FA] placeholder:text-[#F8F9FA]/25 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="last-name" className="text-xs tracking-widest uppercase text-[#F8F9FA]/50">
                {"姓"}
              </Label>
              <Input
                id="last-name"
                type="text"
                placeholder="田中"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="h-12 bg-[#F8F9FA]/5 border-[#F8F9FA]/10 text-[#F8F9FA] placeholder:text-[#F8F9FA]/25 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="first-name" className="text-xs tracking-widest uppercase text-[#F8F9FA]/50">
                {"名"}
              </Label>
              <Input
                id="first-name"
                type="text"
                placeholder="太郎"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="h-12 bg-[#F8F9FA]/5 border-[#F8F9FA]/10 text-[#F8F9FA] placeholder:text-[#F8F9FA]/25 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-email" className="text-xs tracking-widest uppercase text-[#F8F9FA]/50">
              {"メールアドレス"}
            </Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-12 bg-[#F8F9FA]/5 border-[#F8F9FA]/10 text-[#F8F9FA] placeholder:text-[#F8F9FA]/25 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-password" className="text-xs tracking-widest uppercase text-[#F8F9FA]/50">
              {"パスワード"}
            </Label>
            <div className="relative">
              <Input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                placeholder="8文字以上（英字・数字を含む）"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-12 bg-[#F8F9FA]/5 border-[#F8F9FA]/10 text-[#F8F9FA] placeholder:text-[#F8F9FA]/25 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20 pr-12"
                required
                minLength={8}
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

          {/* Screening Question */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded tracking-wider uppercase">
                {"審査項目"}
              </span>
            </div>
            <Label htmlFor="screening" className="text-xs text-[#F8F9FA]/70 leading-relaxed">
              {"あなたが今、一番知りたいこと（または解決したい課題）を教えてください"}
            </Label>
            <Textarea
              id="screening"
              placeholder="地方の観光資源を活用した新しいビジネスモデルについて..."
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="min-h-[100px] bg-[#F8F9FA]/5 border-[#F8F9FA]/10 text-[#F8F9FA] placeholder:text-[#F8F9FA]/25 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20 resize-none"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B3022] font-medium tracking-wider mt-4"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[#1B3022]/30 border-t-[#1B3022] rounded-full animate-spin" />
                {"送信中..."}
              </span>
            ) : (
              "登録申請する"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-[#F8F9FA]/30 leading-relaxed">
          {"登録申請後、メール認証と審査を経てアカウントが有効化されます。"}
          <br />
          {"既にアカウントをお持ちの方は"}
          <Link href="/" className="text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors ml-1">
            {"ログイン"}
          </Link>
        </p>
      </div>
    </div>
  )
}
