"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { submitScreeningAnswer } from "@/app/actions/auth"
import { createClient } from "@/lib/supabase/client"

export default function SignupCompletePage() {
  const [mounted, setMounted] = useState(false)
  const [answer, setAnswer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsAuthenticated(true)
      } else {
        window.location.href = "/"
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    const result = await submitScreeningAnswer(answer)

    setIsSubmitting(false)

    if (result && "error" in result && result.error) {
      setError(result.error)
      return
    }

    setIsComplete(true)
  }

  if (!mounted || !isAuthenticated) return null

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
              {"管理者による審査を経てアカウントが有効化されます。"}
              <br />
              {"通常1〜2営業日以内にご連絡差し上げます。"}
            </p>
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
          <h1 className="font-serif text-3xl tracking-wider text-[#F8F9FA]">TheJapanLocalMedia</h1>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-[#D4AF37]" />
            <p className="text-xs tracking-[0.3em] uppercase text-[#D4AF37]">{"Registration Complete"}</p>
            <span className="h-px w-8 bg-[#D4AF37]" />
          </div>
          <p className="mt-4 text-sm text-[#F8F9FA]/70 font-light">
            {"最後に審査質問にお答えください"}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Screening Question Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
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
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="min-h-[100px] bg-[#F8F9FA]/5 border-[#F8F9FA]/10 text-[#F8F9FA] placeholder:text-[#F8F9FA]/25 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20 resize-none"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !answer.trim()}
            className="w-full h-12 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B3022] font-medium tracking-wider"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[#1B3022]/30 border-t-[#1B3022] rounded-full animate-spin" />
                {"送信中..."}
              </span>
            ) : (
              "送信して登録を完了する"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
