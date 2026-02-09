"use client"

import { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Clock,
  Share2,
  Link2,
  Copy,
  Check,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Heart,
  Bookmark,
  MessageCircle,
  ThumbsUp,
  ChevronRight,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { useContentStore } from "@/lib/store/use-content-store"
import { useUserStore } from "@/lib/store/use-user-store"

/* ---------- Mock/Sample Data for Layout Demo (Fallbacks) ---------- */
const sampleArticleBody = [
  "地方創生の文脈で「関係人口」という言葉が使われるようになって久しい。しかし、その実態を正確に把握し、戦略的に活用している自治体はまだ少ない。本稿では、全国47都道府県の移住相談データと、独自に実施した3,000人規模のアンケート調査の結果を交差させ、「関係人口」の設計図を描き出す。",
  "heading:第一章：数字が語る変化の兆し",
  "2024年の地方移住相談件数は前年比23%増の約58万件に達した。しかし、より注目すべきは「完全移住」ではなく「二拠点居住」を希望する層が全体の41%を占めるようになった点だ。",
  "quote:「移住」ではなく「関わり続ける」ことが、地方と人との新しい関係性の核心である。",
  "heading:第二章：成功する自治体の共通パターン",
  "関係人口の獲得に成功している自治体には、いくつかの共通するパターンが見られる。第一に、「お試し移住」プログラムの質が高い。",
]

const relatedVideos = [
  { id: "1", title: "消えゆく集落、再生の灯火", thumbnail: "/images/documentary-1.jpg", duration: "48:32", author: "JUNKAN Documentary", views: "2.4K" },
  { id: "2", title: "海が結ぶ未来 - 漁村とテクノロジーの融合", thumbnail: "/images/documentary-2.jpg", duration: "35:18", author: "JUNKAN Documentary", views: "1.8K" },
]

const relatedArticles = [
  { id: "art-2", title: "温泉×ワーケーション：月商3000万を実現した旅館の戦略", author: "鈴木 理恵", readTime: "8分" },
  { id: "art-3", title: "伝統工芸のDX：後継者不足を逆手に取ったブランド戦略", author: "山田 健一", readTime: "10分" },
]

/* ---------- Component ---------- */
export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { contents, incrementViews } = useContentStore()
  const content = contents.find(c => c.id === id)

  const [mounted, setMounted] = useState(false)
  const [readProgress, setReadProgress] = useState(0)
  const [copied, setCopied] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (id) incrementViews(id)
  }, [id, incrementViews])

  useEffect(() => {
    if (!content || content.type !== "article") return
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = Math.min((scrollTop / docHeight) * 100, 100)
      setReadProgress(progress)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [content])

  useEffect(() => {
    if (!isPlaying || !content || content.type !== "video") return
    const timer = setInterval(() => {
      setVideoProgress((prev) => {
        if (prev >= 100) { setIsPlaying(false); return 100 }
        return prev + 0.5
      })
    }, 200)
    return () => clearInterval(timer)
  }, [isPlaying, content])

  if (!mounted || !content) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1B3022]/10" />
          <p className="text-sm text-[#1B3022]/40">読み込み中...</p>
        </div>
      </div>
    )
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://junkan.app/invite/abc123xyz?ref=${id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /* ==================== VIDEO (YouTube style) ==================== */
  if (content.type === "video") {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <AppHeader />

        {/* Video player - full width */}
        <div className="bg-[#0f0f0f]">
          <div className="mx-auto max-w-[1200px]">
            <div className="relative aspect-video group cursor-pointer" onClick={() => setIsPlaying(!isPlaying)}>
              <Image
                src={content.thumbnail || "/placeholder.svg"}
                alt={content.title}
                fill
                className={cn("object-cover transition-opacity duration-300", isPlaying && "opacity-20")}
              />
              <div className="absolute inset-0 bg-black/30" />

              {/* Center play button */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[72px] h-[72px] rounded-full bg-[#D4AF37]/90 flex items-center justify-center hover:bg-[#D4AF37] transition-colors shadow-xl">
                    <Play className="w-8 h-8 text-[#1B3022] ml-1" />
                  </div>
                </div>
              )}

              {/* Premium badge */}
              {content.premium && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-[#D4AF37] px-3 py-1.5 rounded-lg text-xs font-medium text-[#1B3022]">
                  <Lock className="w-3.5 h-3.5" />
                  {`${content.requiredRank}以上限定`}
                </div>
              )}

              {/* Bottom controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Progress value={videoProgress} className="h-1 bg-white/20 [&>div]:bg-[#D4AF37] mb-3 cursor-pointer" />
                <div className="flex items-center justify-between text-white/80">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying) }}
                      aria-label={isPlaying ? "一時停止" : "再生"}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setMuted(!muted) }}
                      aria-label={muted ? "ミュート解除" : "ミュート"}
                    >
                      {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <span className="text-xs font-mono">
                      {"00:00"} / {content.duration}
                    </span>
                  </div>
                  <button type="button" onClick={(e) => e.stopPropagation()} aria-label="フルスクリーン">
                    <Maximize2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video info + Sidebar */}
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main column */}
            <div className="flex-1 min-w-0 space-y-5">
              {/* Title */}
              <h1 className="font-serif text-xl md:text-2xl text-[#1B3022] leading-relaxed text-balance">
                {content.title}
              </h1>

              {/* Meta + Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1B3022] flex items-center justify-center">
                    <span className="text-sm font-serif text-[#D4AF37]">{"J"}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1B3022]">{content.author}</p>
                    <p className="text-xs text-[#1B3022]/40">{`${content.publishDate} - 再生 ${content.views.toLocaleString()}回`}</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLiked(!liked)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-colors",
                      liked ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-[#1B3022]/5 text-[#1B3022]/60 hover:bg-[#1B3022]/10"
                    )}
                  >
                    <ThumbsUp className={cn("w-4 h-4", liked && "fill-current")} />
                    {"128"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookmarked(!bookmarked)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-colors",
                      bookmarked ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-[#1B3022]/5 text-[#1B3022]/60 hover:bg-[#1B3022]/10"
                    )}
                  >
                    <Bookmark className={cn("w-4 h-4", bookmarked && "fill-current")} />
                    {"保存"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm bg-[#1B3022]/5 text-[#1B3022]/60 hover:bg-[#1B3022]/10 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    {"共有"}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="rounded-xl bg-[#1B3022]/5 p-4 space-y-2">
                <p className="text-sm text-[#1B3022]/70 leading-relaxed">{content.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {content.tags?.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1B3022]/5 text-[#1B3022]/50">
                      {`#${tag}`}
                    </span>
                  ))}
                </div>
              </div>

              {/* Share CTA */}
              <div className="rounded-xl bg-[#1B3022] p-5 flex items-center gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F8F9FA]">{"信頼できる方にシェアして招待枠を獲得"}</p>
                  <p className="text-xs text-[#F8F9FA]/40 mt-0.5">{"シェアすると招待枠を1つ獲得できます"}</p>
                </div>
                <Button
                  onClick={handleCopy}
                  size="sm"
                  className="shrink-0 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B3022] text-xs gap-1.5"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {"コピー"}
                </Button>
              </div>
            </div>

            {/* Sidebar - Related Videos */}
            <aside className="lg:w-[360px] shrink-0 space-y-4">
              <h3 className="text-sm font-medium text-[#1B3022]/60 tracking-wider">{"関連動画"}</h3>
              <div className="space-y-3">
                {relatedVideos.map((video) => (
                  <Link
                    key={video.id}
                    href={`/article/${video.id}`}
                    className="flex gap-3 group"
                  >
                    <div className="relative w-[168px] shrink-0 aspect-video rounded-lg overflow-hidden bg-[#1B3022]/10">
                      <Image src={video.thumbnail || "/placeholder.svg"} alt={video.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                        {video.duration}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <h4 className="text-sm text-[#1B3022] leading-snug line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                        {video.title}
                      </h4>
                      <p className="text-xs text-[#1B3022]/40 mt-1.5">{video.author}</p>
                      <p className="text-xs text-[#1B3022]/30">{`${video.views}回視聴`}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    )
  }

  /* ==================== ARTICLE (note.jp style) ==================== */
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-0.5">
        <div className="h-full bg-[#D4AF37] transition-all duration-150" style={{ width: `${readProgress}%` }} />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#1B3022]/5">
        <AppHeader />
      </header>

      <main className="mx-auto max-w-[680px] px-5 md:px-0 pt-28 pb-20 relative z-10">
        {/* Article Cover Image */}
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-12 bg-[#1B3022]/5">
          <Image
            src={content.thumbnail || "/placeholder.svg"}
            alt={content.title}
            fill
            className="object-cover transition-transform duration-700 hover:scale-105"
            priority
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl" />
        </div>
        {/* Article Header */}
        <header className="space-y-6 mb-10">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {content.tags?.map((tag: string) => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full border border-[#1B3022]/10 text-[#1B3022]/50 bg-[#F8F9FA]">
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="font-serif text-2xl md:text-[32px] text-[#1B3022] leading-[1.5] tracking-tight text-balance">
            {content.title}
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-[#1B3022]/50 leading-relaxed font-light">
            {content.description}
          </p>

          {/* Author card */}
          <div className="flex items-center gap-4 py-5 border-y border-[#1B3022]/8">
            <div className="w-12 h-12 rounded-full bg-[#1B3022]/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-serif text-[#1B3022]/60">{content.author.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[#1B3022]">{content.author}</p>
                <button
                  type="button"
                  className="text-[10px] px-2.5 py-1 rounded-full border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
                >
                  {"フォロー"}
                </button>
              </div>
              <p className="text-xs text-[#1B3022]/40 mt-0.5">{content.publishDate}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#1B3022]/40">
              <Clock className="w-3.5 h-3.5" />
              {content.type === "article" ? "12分" : content.duration}
            </div>
          </div>
        </header>

        {/* Article Body */}
        <article className="space-y-7 mb-12">
          {content.body ? (
            typeof content.body === "string" ? (
              <p className="text-[#1B3022]/75 leading-[2] text-[15px] md:text-base font-light">
                {content.body}
              </p>
            ) : (
              (content.body as string[]).map((paragraph: string, i: number) => {
                if (paragraph.startsWith("heading:")) {
                  return (
                    <h2 key={i} className="font-serif text-xl md:text-[22px] text-[#1B3022] pt-6 pb-1 border-b border-[#1B3022]/8">
                      {paragraph.replace("heading:", "")}
                    </h2>
                  )
                }
                if (paragraph.startsWith("quote:")) {
                  return (
                    <blockquote key={i} className="relative pl-5 border-l-[3px] border-[#D4AF37] py-2">
                      <p className="text-[#1B3022]/70 leading-[1.9] text-base italic font-serif">
                        {paragraph.replace("quote:", "")}
                      </p>
                    </blockquote>
                  )
                }
                return (
                  <p key={i} className="text-[#1B3022]/75 leading-[2] text-[15px] md:text-base font-light">
                    {paragraph}
                  </p>
                )
              })
            )
          ) : (
            <p className="text-[#1B3022]/75 leading-[2] text-[15px] md:text-base font-light">
              {sampleArticleBody.map((p, i) => <span key={i} className="block mb-4">{p}</span>)}
            </p>
          )}
        </article>

        {/* Floating action bar - note.jp style */}
        <div className="sticky bottom-6 z-50 flex items-center justify-center">
          <div className="flex items-center gap-1 bg-[#F8F9FA] border border-[#1B3022]/10 rounded-full px-2 py-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => setLiked(!liked)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all",
                liked ? "bg-red-50 text-red-500" : "text-[#1B3022]/50 hover:bg-[#1B3022]/5"
              )}
            >
              <Heart className={cn("w-[18px] h-[18px]", liked && "fill-current")} />
              <span className="text-xs">{"42"}</span>
            </button>
            <div className="w-px h-5 bg-[#1B3022]/10" />
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-[#1B3022]/50 hover:bg-[#1B3022]/5 transition-colors"
            >
              <MessageCircle className="w-[18px] h-[18px]" />
              <span className="text-xs">{"8"}</span>
            </button>
            <div className="w-px h-5 bg-[#1B3022]/10" />
            <button
              type="button"
              onClick={() => setBookmarked(!bookmarked)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all",
                bookmarked ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "text-[#1B3022]/50 hover:bg-[#1B3022]/5"
              )}
            >
              <Bookmark className={cn("w-[18px] h-[18px]", bookmarked && "fill-current")} />
            </button>
            <div className="w-px h-5 bg-[#1B3022]/10" />
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-[#1B3022]/50 hover:bg-[#1B3022]/5 transition-colors"
            >
              <Share2 className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* Author detail card (note.jp style) */}
        <div className="mt-16 rounded-2xl border border-[#1B3022]/8 bg-background p-6 md:p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#1B3022]/10 flex items-center justify-center">
              <span className="text-2xl font-serif text-[#1B3022]/60">{content.author.charAt(0)}</span>
            </div>
            <div>
              <p className="text-base font-medium text-[#1B3022]">{content.author}</p>
              <p className="text-xs text-[#1B3022]/40 mt-2 leading-relaxed max-w-sm mx-auto">
                {content.authorBio || "JUNKANの認定コントリビューターとして、地方創生や観光の最前線で活動する専門家。"}
              </p>
            </div>
            <button
              type="button"
              className="px-6 py-2 rounded-full border border-[#D4AF37] text-[#D4AF37] text-sm hover:bg-[#D4AF37]/10 transition-colors"
            >
              {"フォローする"}
            </button>
          </div>
        </div>

        {/* Related Articles */}
        <div className="mt-12 mb-16 space-y-5">
          <h3 className="text-sm font-medium text-[#1B3022]/50 tracking-wider">{"この記事を読んだ方へ"}</h3>
          <div className="space-y-1">
            {relatedArticles.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.id}`}
                className="group flex items-center gap-4 py-4 border-b border-[#1B3022]/5 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm text-[#1B3022] leading-relaxed group-hover:text-[#D4AF37] transition-colors text-pretty">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-[#1B3022]/35">
                    <span>{article.author}</span>
                    <span>{" / "}</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#1B3022]/15 group-hover:text-[#D4AF37] transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </main>

    </div>
  )
}
