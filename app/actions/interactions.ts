"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ──────── いいねトグル ────────
export async function toggleLike(contentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const { data: existing } = await supabase
    .from("content_interactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("content_id", contentId)
    .eq("type", "like")
    .maybeSingle()

  if (existing) {
    await supabase
      .from("content_interactions")
      .delete()
      .eq("id", existing.id)
    return { liked: false }
  } else {
    await supabase
      .from("content_interactions")
      .insert({ user_id: user.id, content_id: contentId, type: "like" })
    return { liked: true }
  }
}

// ──────── ブックマークトグル ────────
export async function toggleBookmark(contentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const { data: existing } = await supabase
    .from("content_interactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("content_id", contentId)
    .eq("type", "bookmark")
    .maybeSingle()

  if (existing) {
    await supabase
      .from("content_interactions")
      .delete()
      .eq("id", existing.id)
    return { bookmarked: false }
  } else {
    await supabase
      .from("content_interactions")
      .insert({ user_id: user.id, content_id: contentId, type: "bookmark" })
    return { bookmarked: true }
  }
}

// ──────── ユーザーのインタラクション状態取得 ────────
export async function getUserInteractions(contentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { liked: false, bookmarked: false }

  const { data } = await supabase
    .from("content_interactions")
    .select("type")
    .eq("user_id", user.id)
    .eq("content_id", contentId)

  const types = (data || []).map(d => d.type)
  return {
    liked: types.includes("like"),
    bookmarked: types.includes("bookmark"),
  }
}

// ──────── いいね済みコンテンツ一覧 ────────
export async function getLikedContents() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const { data, error } = await supabase
    .from("content_interactions")
    .select("content_id, created_at, contents(*)")
    .eq("user_id", user.id)
    .eq("type", "like")
    .order("created_at", { ascending: false })

  if (error) return { error: "いいね一覧の取得に失敗しました" }
  return { data }
}

// ──────── ブックマーク済みコンテンツ一覧 ────────
export async function getBookmarkedContents() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未認証です" }

  const { data, error } = await supabase
    .from("content_interactions")
    .select("content_id, created_at, contents(*)")
    .eq("user_id", user.id)
    .eq("type", "bookmark")
    .order("created_at", { ascending: false })

  if (error) return { error: "保存済み一覧の取得に失敗しました" }
  return { data }
}

// ──────── おすすめコンテンツ（いいね+ブックマーク数上位） ────────
export async function getRecommendedContents(limit: number = 3) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contents")
    .select("*, content_interactions(type)")
    .eq("status", "published")

  if (error || !data) return { data: [] }

  const scored = data.map(content => {
    const interactions = (content.content_interactions || []) as { type: string }[]
    const likeCount = interactions.filter(i => i.type === "like").length
    const bookmarkCount = interactions.filter(i => i.type === "bookmark").length
    return { ...content, score: likeCount + bookmarkCount }
  })

  scored.sort((a, b) => b.score - a.score)
  return { data: scored.slice(0, limit) }
}
