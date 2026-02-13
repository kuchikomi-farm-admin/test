"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { AppHeader } from "@/components/app-header"
import { Heart, Bookmark, Clock, ArrowRight, FileText, Video, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { getLikedContents, getBookmarkedContents } from "@/app/actions/interactions"

type TabKey = "likes" | "bookmarks"

interface ContentItem {
  content_id: string
  created_at: string
  contents: {
    id: string
    type: string
    title: string
    description: string | null
    thumbnail_url: string | null
    author_name: string
    publish_date: string | null
    duration: string | null
  } | null
}

const typeIcons: Record<string, typeof FileText> = {
  article: FileText,
  video: Video,
  external: ExternalLink,
}

export default function FavoritesPage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>("likes")
  const [likedItems, setLikedItems] = useState<ContentItem[]>([])
  const [bookmarkedItems, setBookmarkedItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    Promise.all([getLikedContents(), getBookmarkedContents()]).then(
      ([likeResult, bookmarkResult]) => {
        if (likeResult && "data" in likeResult && likeResult.data) {
          setLikedItems(likeResult.data as ContentItem[])
        }
        if (bookmarkResult && "data" in bookmarkResult && bookmarkResult.data) {
          setBookmarkedItems(bookmarkResult.data as ContentItem[])
        }
        setLoading(false)
      }
    )
  }, [])

  if (!mounted) return null

  const items = activeTab === "likes" ? likedItems : bookmarkedItems

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 md:px-6 py-8 space-y-6">
        <div>
          <p className="text-xs text-[#1B3022]/40 tracking-wider uppercase">Favorites</p>
          <h1 className="font-serif text-2xl text-[#1B3022] mt-1">{"いいね / 保存済み"}</h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#1B3022]/10">
          <div className="flex items-center gap-0">
            {([
              { key: "likes" as const, label: "いいね", icon: Heart, count: likedItems.length },
              { key: "bookmarks" as const, label: "保存済み", icon: Bookmark, count: bookmarkedItems.length },
            ]).map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3.5 text-sm transition-colors relative",
                    isActive
                      ? "text-[#1B3022] font-medium"
                      : "text-[#1B3022]/40 hover:text-[#1B3022]/60"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive && tab.key === "likes" && "text-red-500")} />
                  {tab.label}
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full",
                      isActive
                        ? "bg-[#D4AF37]/15 text-[#D4AF37]"
                        : "bg-[#1B3022]/5 text-[#1B3022]/30"
                    )}
                  >
                    {tab.count}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#1B3022]/10" />
              <p className="text-sm text-[#1B3022]/40">{"読み込み中..."}</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            {activeTab === "likes" ? (
              <Heart className="w-10 h-10 text-[#1B3022]/10 mx-auto" />
            ) : (
              <Bookmark className="w-10 h-10 text-[#1B3022]/10 mx-auto" />
            )}
            <p className="text-sm text-[#1B3022]/40">
              {activeTab === "likes"
                ? "いいねしたコンテンツはまだありません"
                : "保存済みのコンテンツはまだありません"}
            </p>
            <Link
              href="/feed"
              className="inline-flex items-center gap-1.5 text-sm text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors"
            >
              {"コンテンツを探す"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-0">
            {items.map((item) => {
              if (!item.contents) return null
              const content = item.contents
              const TypeIcon = typeIcons[content.type] || FileText
              return (
                <Link
                  key={item.content_id}
                  href={`/article/${content.id}`}
                  className="group flex items-start gap-4 py-5 border-b border-[#1B3022]/6 hover:bg-[#1B3022]/[0.02] px-3 -mx-3 rounded-lg transition-colors"
                >
                  {content.thumbnail_url ? (
                    <div className="relative w-[120px] md:w-[160px] shrink-0 aspect-[16/10] rounded-lg overflow-hidden bg-[#1B3022]/5">
                      <Image
                        src={content.thumbnail_url}
                        alt={content.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-[#1B3022]/5 flex items-center justify-center">
                      <TypeIcon className="w-5 h-5 text-[#1B3022]/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-2">
                    <h3 className="font-serif text-base text-[#1B3022] leading-relaxed group-hover:text-[#D4AF37] transition-colors text-pretty line-clamp-2">
                      {content.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#1B3022]/40">
                      <span className="font-medium text-[#1B3022]/60">{content.author_name}</span>
                      {content.publish_date && (
                        <>
                          <span className="text-[#1B3022]/15">{"/"}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {content.publish_date}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="shrink-0 w-4 h-4 text-[#1B3022]/10 group-hover:text-[#D4AF37] transition-colors mt-2 hidden md:block" />
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
