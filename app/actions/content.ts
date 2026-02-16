"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

// ──────── コンテンツ一覧取得（公開済み） ────────
export async function getPublishedContents() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  // admin client を使い RLS に依存しない（Server Action 内で auth.uid() が
  // 正しく解決されないケースを回避）
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from("contents")
    .select("*")
    .eq("status", "published")
    .order("publish_date", { ascending: false })

  if (error) return { error: "コンテンツの取得に失敗しました" }
  return { data: data || [] }
}

// ──────── コンテンツ一覧取得（管理者用・全件） ────────
export async function getAllContents() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") return { error: "管理者権限がありません" }

  const { data, error } = await adminClient
    .from("contents")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return { error: "コンテンツの取得に失敗しました" }
  return { data: data || [] }
}

// ──────── コンテンツ作成 ────────
export async function createContent(input: {
  type: string
  title: string
  authorName: string
  body?: string
  url?: string
  thumbnailUrl?: string
  status: string
  publishDate?: string
  premium: boolean
  requiredRank: string
  duration?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from("contents")
    .insert({
      type: input.type as "article" | "video" | "external",
      title: input.title,
      author_name: input.authorName,
      author_id: user.id,
      body: input.body || null,
      url: input.url || null,
      thumbnail_url: input.thumbnailUrl || null,
      status: input.status as "draft" | "scheduled" | "published",
      publish_date: input.publishDate || (input.status === "published" ? new Date().toISOString() : null),
      premium: input.premium,
      required_rank: (input.requiredRank === "all" ? "standard" : input.requiredRank) as "standard" | "gold" | "platinum" | "diamond",
      duration: input.duration || null,
    })
    .select()
    .single()

  if (error) return { error: `コンテンツの作成に失敗しました: ${error.message}` }

  revalidatePath("/feed")
  revalidatePath("/admin")
  return { data }
}

// ──────── コンテンツ削除 ────────
export async function deleteContent(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from("contents")
    .delete()
    .eq("id", id)

  if (error) return { error: "コンテンツの削除に失敗しました" }

  revalidatePath("/feed")
  revalidatePath("/admin")
  return { success: true }
}

// ──────── コンテンツ単体取得 ────────
export async function getContentById(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from("contents")
    .select("*")
    .eq("id", id)
    .single()

  if (error) return { error: "コンテンツが見つかりません" }
  return { data }
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

// ──────── サムネイルアップロード ────────
export async function uploadThumbnail(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const file = formData.get("file") as File | null
  if (!file) return { error: "ファイルが選択されていません" }

  // バリデーション
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "対応していない画像形式です（JPEG, PNG, WebP, GIF のみ）" }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "ファイルサイズが5MBを超えています" }
  }

  // ファイル名生成
  const ext = file.name.split(".").pop() || "jpg"
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = fileName

  // admin client で Storage RLS をバイパス
  const adminClient = createAdminClient()

  const { error: uploadError } = await adminClient.storage
    .from("thumbnails")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { error: `アップロードに失敗しました: ${uploadError.message}` }
  }

  // 公開URLを取得
  const { data: urlData } = adminClient.storage
    .from("thumbnails")
    .getPublicUrl(filePath)

  return { url: urlData.publicUrl }
}

// ──────── コンテンツのサムネイルURL更新 ────────
export async function updateContentThumbnail(contentId: string, thumbnailUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from("contents")
    .update({ thumbnail_url: thumbnailUrl })
    .eq("id", contentId)

  if (error) return { error: "サムネイルの更新に失敗しました" }
  return { success: true }
}

// ──────── 動画アップロード ────────
const VIDEO_MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"]

export async function uploadVideo(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const file = formData.get("file") as File | null
  if (!file) return { error: "ファイルが選択されていません" }

  // バリデーション
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return { error: "対応していない動画形式です（MP4, WebM, MOV, AVI のみ）" }
  }

  if (file.size > VIDEO_MAX_FILE_SIZE) {
    return { error: "ファイルサイズが100MBを超えています" }
  }

  // ファイル名生成
  const ext = file.name.split(".").pop() || "mp4"
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = `videos/${fileName}`

  // admin client で Storage RLS をバイパス
  const adminClient = createAdminClient()

  const { error: uploadError } = await adminClient.storage
    .from("content-media")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { error: `動画のアップロードに失敗しました: ${uploadError.message}` }
  }

  // 公開URLを取得
  const { data: urlData } = adminClient.storage
    .from("content-media")
    .getPublicUrl(filePath)

  return { url: urlData.publicUrl }
}
