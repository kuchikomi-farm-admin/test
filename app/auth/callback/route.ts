import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const inviteCode = searchParams.get("invite_code")

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server Component context — ignore
            }
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    if (session?.user) {
      // 招待コードがある場合（OAuth 新規登録）→ 後付けリンク
      if (inviteCode) {
        await supabase.rpc("link_invite_code", { input_code: inviteCode })
      }

      // プロフィールのステータスを確認
      const { data: profile } = await supabase
        .from("profiles")
        .select("status, screening_answer")
        .eq("id", session.user.id)
        .single()

      if (profile?.status === "active") {
        // アクティブ → フィードへ（自動ログイン完了）
        return NextResponse.redirect(`${origin}/feed`)
      }

      if (profile?.status === "suspended") {
        // 停止中 → ゲートウェイへ + メッセージ
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${origin}/?message=${encodeURIComponent("アカウントが停止されています。管理者にお問い合わせください。")}`
        )
      }

      // pending — 審査質問が未入力（OAuth 新規登録）→ 審査質問ページへ
      if (!profile?.screening_answer) {
        return NextResponse.redirect(`${origin}/signup/complete`)
      }

      // pending（審査質問入力済み）→ ゲートウェイへ + 承認待ちメッセージ
      await supabase.auth.signOut()
      return NextResponse.redirect(
        `${origin}/?message=${encodeURIComponent("メール認証が完了しました。管理者の承認をお待ちください。")}`
      )
    }
  }

  // フォールバック
  return NextResponse.redirect(`${origin}/`)
}
