"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import {
  Play,
  Clock,
  Share2,
  BookOpen,
  ArrowRight,
  Users,
  Lock,
  ExternalLink,
  Video,
  FileText,
  Link2,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { getPublishedContents } from "@/app/actions/content"
import type { Content, ContentType, ContentStatus, MemberRank } from "@/lib/types"

type TabKey = "articles" | "videos" | "external"

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function mapDbContent(c: Record<string, unknown>): Content {
  return {
    id: c.id as string,
    type: c.type as ContentType,
    title: c.title as string,
    description: (c.description as string) || "",
    body: (c.body as string) || "",
    status: c.status as ContentStatus,
    publishDate: formatDate((c.publish_date as string) || ""),
    author: c.author_name as string,
    thumbnail: c.thumbnail_url as string | undefined,
    views: (c.views as number) || 0,
    premium: (c.premium as boolean) || false,
    requiredRank: (c.required_rank as MemberRank) || "all",
    url: c.url as string | undefined,
    duration: c.duration as string | undefined,
  }
}

export default function FeedPage() {
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<Content[]>([])

  useEffect(() => {
    setMounted(true)
    getPublishedContents().then((result) => {
      if ("data" in result && result.data) {
        setItems(result.data.map(mapDbContent))
      }
    })
  }, [])

  const [activeTab, setActiveTab] = useState<TabKey>("articles")

  const recommended = items.slice(0, 3)
  const articles = items.filter(c => c.type === "article")
  const videos = items.filter(c => c.type === "video")
  const externalLinks = items.filter(c => c.type === "external")

  const tabs = [
    { key: "articles", label: "記事", icon: FileText, count: articles.length },
    { key: "videos", label: "動画", icon: Video, count: videos.length },
    { key: "external", label: "外部リンク", icon: Link2, count: externalLinks.length },
  ] as const

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 md:px-6 py-8 space-y-10">
        {/* ===== Recommended Section ===== */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px flex-1 bg-[#1B3022]/10" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <h2 className="text-xs tracking-[0.3em] uppercase text-[#1B3022]/50 font-medium">
                {"Recommended"}
              </h2>
            </div>
            <span className="h-px flex-1 bg-[#1B3022]/10" />
          </div>

          {/* Large featured card + 2 smaller */}
          <div className="grid md:grid-cols-5 gap-4">
            {recommended.length > 0 && (
              <>
                {/* Main featured */}
                <Link
                  href={`/article/${recommended[0].id}`}
                  className="md:col-span-3 group block rounded-xl overflow-hidden bg-[#1B3022] hover:ring-2 hover:ring-[#D4AF37]/30 transition-all"
                >
                  <div className="relative aspect-video">
                    <Image
                      src={recommended[0].thumbnail || "/placeholder.svg"}
                      alt={recommended[0].title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1B3022] via-[#1B3022]/30 to-transparent" />
                    {recommended[0].type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-[#D4AF37]/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 text-[#1B3022] ml-0.5" />
                        </div>
                      </div>
                    )}
                    {recommended[0].duration && (
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-[#1B3022]/80 px-2 py-1 rounded text-xs text-[#F8F9FA]/80 font-mono">
                        <Clock className="w-3 h-3" />
                        {recommended[0].duration}
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37]">
                        {recommended[0].type === "video" ? "動画" : "記事"}
                      </span>
                      <span className="text-[10px] text-[#F8F9FA]/40">{recommended[0].publishDate}</span>
                    </div>
                    <h3 className="font-serif text-lg text-[#F8F9FA] leading-relaxed group-hover:text-[#D4AF37] transition-colors text-balance">
                      {recommended[0].title}
                    </h3>
                    <p className="text-xs text-[#F8F9FA]/50 leading-relaxed line-clamp-2">
                      {recommended[0].description}
                    </p>
                  </div>
                </Link>

                {/* 2 smaller cards */}
                <div className="md:col-span-2 flex flex-col gap-4">
                  {recommended.slice(1).map((item) => (
                    <Link
                      key={item.id}
                      href={`/article/${item.id}`}
                      className="group flex-1 block rounded-xl overflow-hidden bg-[#1B3022] hover:ring-2 hover:ring-[#D4AF37]/30 transition-all"
                    >
                      <div className="relative aspect-[16/9]">
                        <Image
                          src={item.thumbnail || "/placeholder.svg"}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1B3022] via-[#1B3022]/40 to-transparent" />
                        {item.type === "video" && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Play className="w-4 h-4 text-[#1B3022] ml-0.5" />
                            </div>
                          </div>
                        )}
                        {item.duration && (
                          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-[#1B3022]/80 px-1.5 py-0.5 rounded text-[10px] text-[#F8F9FA]/80 font-mono">
                            <Clock className="w-2.5 h-2.5" />
                            {item.duration}
                          </div>
                        )}
                        {item.premium && (
                          <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#D4AF37] px-2 py-0.5 rounded text-[9px] font-medium text-[#1B3022]">
                            <Lock className="w-2.5 h-2.5" />
                            {`${item.requiredRank}以上`}
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37]">
                            {item.type === "video" ? "動画" : "記事"}
                          </span>
                          <span className="text-[10px] text-[#F8F9FA]/40">{item.publishDate}</span>
                        </div>
                        <h3 className="font-serif text-sm text-[#F8F9FA] leading-relaxed group-hover:text-[#D4AF37] transition-colors line-clamp-2 text-pretty">
                          {item.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ===== Tabs Section ===== */}
        <section>
          {/* Tab bar */}
          <div className="border-b border-[#1B3022]/10">
            <div className="flex items-center gap-0">
              {tabs.map((tab) => {
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
                    <Icon className="w-4 h-4" />
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
                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab content */}
          <div className="pt-6">
            {/* ---- Articles tab ---- */}
            {activeTab === "articles" && (
              <div className="space-y-0">
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.id}`}
                    className="group flex items-start gap-4 md:gap-5 py-5 border-b border-[#1B3022]/6 hover:bg-[#1B3022]/[0.02] px-3 -mx-3 rounded-lg transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-[120px] md:w-[160px] shrink-0 aspect-[16/10] rounded-lg overflow-hidden bg-[#1B3022]/5">
                      <Image
                        src={article.thumbnail || "/placeholder.svg"}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {article.premium && (
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-[#D4AF37] px-1.5 py-0.5 rounded text-[8px] font-medium text-[#1B3022]">
                          <Lock className="w-2 h-2" />
                          {article.requiredRank}
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <h3 className="font-serif text-base md:text-lg text-[#1B3022] leading-relaxed group-hover:text-[#D4AF37] transition-colors text-pretty line-clamp-2">
                        {article.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#1B3022]/40">
                        <span className="font-medium text-[#1B3022]/60">{article.author}</span>
                        <span className="text-[#1B3022]/15">{"/"}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.publishDate}
                        </span>
                        <span className="text-[#1B3022]/15">{"/"}</span>
                        <span>{article.publishDate}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {article.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-[#1B3022]/5 text-[#1B3022]/40"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ArrowRight className="shrink-0 w-4 h-4 text-[#1B3022]/10 group-hover:text-[#D4AF37] transition-colors mt-2 hidden md:block" />
                  </Link>
                ))}
              </div>
            )}

            {/* ---- Videos tab ---- */}
            {activeTab === "videos" && (
              <div className="grid md:grid-cols-2 gap-5">
                {videos.map((video) => (
                  <Link
                    key={video.id}
                    href={`/article/${video.id}`}
                    className="group block rounded-xl overflow-hidden border border-[#1B3022]/6 bg-background hover:border-[#D4AF37]/30 hover:shadow-md transition-all"
                  >
                    <div className="relative aspect-video">
                      <Image
                        src={video.thumbnail || "/placeholder.svg"}
                        alt={video.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#D4AF37]/90 flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                          <Play className="w-5 h-5 text-[#1B3022] ml-0.5" />
                        </div>
                      </div>
                      {/* Duration */}
                      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[11px] text-white/90 font-mono">
                        {video.duration}
                      </div>
                      {/* Premium badge */}
                      {video.premium && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#D4AF37] px-2 py-0.5 rounded text-[9px] font-medium text-[#1B3022]">
                          <Lock className="w-2.5 h-2.5" />
                          {`${video.requiredRank}以上`}
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-serif text-sm md:text-base text-[#1B3022] leading-relaxed group-hover:text-[#D4AF37] transition-colors line-clamp-2 text-pretty">
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-[#1B3022]/40">
                        <span className="font-medium text-[#1B3022]/50">{video.author}</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {`${video.views}回視聴`}
                        </span>
                        <span>{video.publishDate}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* ---- External Links tab ---- */}
            {activeTab === "external" && (
              <div className="space-y-0">
                {externalLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-4 py-5 border-b border-[#1B3022]/6 hover:bg-[#1B3022]/[0.02] px-3 -mx-3 rounded-lg transition-colors"
                  >
                    {/* Icon */}
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-[#1B3022]/5 flex items-center justify-center group-hover:bg-[#D4AF37]/10 transition-colors">
                      <ExternalLink className="w-5 h-5 text-[#1B3022]/30 group-hover:text-[#D4AF37] transition-colors" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <h3 className="text-base text-[#1B3022] leading-relaxed group-hover:text-[#D4AF37] transition-colors text-pretty line-clamp-2">
                        {link.title}
                      </h3>
                      <p className="text-xs text-[#1B3022]/40 leading-relaxed line-clamp-2">
                        {link.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#1B3022]/30">
                        <span className="font-medium text-[#1B3022]/50">{link.author}</span>
                        <span className="text-[#1B3022]/15">{"/"}</span>
                        <span>{link.publishDate}</span>
                        <span className="text-[#1B3022]/15">{"/"}</span>
                        <div className="flex gap-1.5">
                          {link.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-[#1B3022]/5 text-[#1B3022]/35"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="shrink-0 w-4 h-4 text-[#1B3022]/10 group-hover:text-[#D4AF37] transition-colors mt-2 hidden md:block" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ===== Share CTA ===== */}
        <section className="rounded-xl bg-[#1B3022] p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-2 text-[#D4AF37]">
                <Users className="w-5 h-5" />
                <span className="text-xs tracking-[0.2em] uppercase">{"Invite & Grow"}</span>
              </div>
              <h3 className="font-serif text-lg text-[#F8F9FA]">
                {"コンテンツをシェアして招待枠を獲得"}
              </h3>
              <p className="text-xs text-[#F8F9FA]/40 leading-relaxed">
                {"信頼できる仲間を招待することで、限定コンテンツへのアクセスが解放されます。"}
              </p>
            </div>
          </div>
          {/* SNS Share Buttons */}
          <div className="flex items-center justify-center md:justify-start gap-3">
            <a
              href="https://twitter.com/intent/tweet?text=TheJapanLocalMedia%E3%81%AB%E6%8B%9B%E5%BE%85%E3%81%95%E3%82%8C%E3%81%BE%E3%81%97%E3%81%9F%EF%BC%81%0A%E9%99%90%E5%AE%9A%E3%82%B3%E3%83%B3%E3%83%86%E3%83%B3%E3%83%84%E3%82%92%E3%83%81%E3%82%A7%E3%83%83%E3%82%AF%E3%81%97%E3%81%A6%E3%81%BF%E3%81%A6%E3%81%8F%E3%81%A0%E3%81%95%E3%81%84%E3%80%82"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              {"X"}
            </a>
            <a
              href="https://social-plugins.line.me/lineit/share?url=https%3A%2F%2Fthejapanlocaledia.app&text=TheJapanLocalMedia%E3%81%AB%E6%8B%9B%E5%BE%85%E3%81%95%E3%82%8C%E3%81%BE%E3%81%97%E3%81%9F%EF%BC%81"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#06C755] hover:bg-[#06C755]/90 text-white text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              {"LINE"}
            </a>
            <a
              href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fthejapanlocaledia.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1877F2] hover:bg-[#1877F2]/90 text-white text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              {"Facebook"}
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
