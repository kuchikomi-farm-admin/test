"use server"

import { createClient } from "@/lib/supabase/server"

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
  const filePath = `thumbnails/${fileName}`

  // Supabase Storage アップロード
  const { error: uploadError } = await supabase.storage
    .from("thumbnails")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { error: "アップロードに失敗しました" }
  }

  // 公開URLを取得
  const { data: urlData } = supabase.storage
    .from("thumbnails")
    .getPublicUrl(filePath)

  return { url: urlData.publicUrl }
}

// ──────── コンテンツのサムネイルURL更新 ────────
export async function updateContentThumbnail(contentId: string, thumbnailUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const { error } = await supabase
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

  // Supabase Storage アップロード
  const { error: uploadError } = await supabase.storage
    .from("content-media")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { error: `動画のアップロードに失敗しました: ${uploadError.message}` }
  }

  // 公開URLを取得
  const { data: urlData } = supabase.storage
    .from("content-media")
    .getPublicUrl(filePath)

  return { url: urlData.publicUrl }
}
