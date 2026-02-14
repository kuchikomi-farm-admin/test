"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Video,
  ExternalLink,
  Plus,
  Calendar,
  Clock,
  Check,
  Eye,
  Lock,
  X,
  ArrowUpDown,
  Search,
  Upload,
  Link2,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { ContentType, ContentStatus, MemberRank } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { uploadThumbnail, uploadVideo, getAllContents, createContent as createContentAction, deleteContent as deleteContentAction } from "@/app/actions/content"
import Image from "next/image"
import { MarkdownEditor } from "@/components/markdown-editor"

/* ---------- Constants ---------- */
const typeConfig: Record<ContentType, { label: string; icon: typeof FileText; color: string }> = {
  article: { label: "記事", icon: FileText, color: "bg-[#1B3022]/10 text-[#1B3022]" },
  video: { label: "動画", icon: Video, color: "bg-[#D4AF37]/10 text-[#D4AF37]" },
  external: { label: "外部リンク", icon: ExternalLink, color: "bg-blue-50 text-blue-600" },
}

const statusConfig: Record<ContentStatus, { label: string; color: string }> = {
  draft: { label: "下書き", color: "bg-[#1B3022]/5 text-[#1B3022]/50" },
  scheduled: { label: "予約中", color: "bg-[#D4AF37]/10 text-[#D4AF37]" },
  published: { label: "公開済", color: "bg-[#1B3022]/10 text-[#1B3022]" },
}

const rankLabels: Record<MemberRank, string> = {
  all: "全会員",
  standard: "スタンダード以上",
  gold: "ゴールド以上",
  platinum: "プラチナ以上",
  diamond: "ダイヤモンド以上",
}

/* ---------- Component ---------- */
interface ContentItem {
  id: string
  type: ContentType
  title: string
  description?: string
  body?: string
  status: ContentStatus
  publishDate: string
  author: string
  thumbnail?: string
  views: number
  likes?: number
  premium: boolean
  requiredRank: MemberRank
  url?: string
  duration?: string
  tags?: string[]
}

export function AdminContent() {
  const { toast } = useToast()
  const [contents, setContents] = useState<ContentItem[]>([])
  // Hydration safety
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    getAllContents().then((result) => {
      if ("data" in result && result.data) {
        setContents(result.data.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          type: c.type as ContentType,
          title: c.title as string,
          description: (c.description as string) || "",
          body: (c.body as string) || "",
          status: c.status as ContentStatus,
          publishDate: (c.publish_date as string) || "",
          author: c.author_name as string,
          thumbnail: c.thumbnail_url as string | undefined,
          views: (c.views as number) || 0,
          premium: (c.premium as boolean) || false,
          requiredRank: (c.required_rank as MemberRank) || "all",
          url: c.url as string | undefined,
          duration: c.duration as string | undefined,
        })))
      }
    })
  }, [])

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [filterType, setFilterType] = useState<"all" | ContentType>("all")
  const [filterStatus, setFilterStatus] = useState<"all" | ContentStatus>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Create form state
  const [newType, setNewType] = useState<ContentType>("article")
  const [newTitle, setNewTitle] = useState("")
  const [newAuthor, setNewAuthor] = useState("")
  const [newBody, setNewBody] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [newVideoUrl, setNewVideoUrl] = useState("")
  const [newScheduleDate, setNewScheduleDate] = useState("")
  const [newIsPremium, setNewIsPremium] = useState(false)
  const [newRequiredRank, setNewRequiredRank] = useState<MemberRank>("all")

  // Thumbnail state
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Loading states
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingVideo(true)
    const formData = new FormData()
    formData.append("file", file)
    const result = await uploadVideo(formData)
    setIsUploadingVideo(false)
    if ("error" in result) {
      toast({ title: "エラー", description: result.error, variant: "destructive" })
      return
    }
    if (result.url) {
      setNewVideoUrl(result.url)
      toast({ title: "アップロード完了", description: "動画URLが設定されました" })
    }
    // Reset file input
    if (videoInputRef.current) videoInputRef.current.value = ""
  }

  const items = mounted ? contents : []

  const filtered = items
    .filter((item) => filterType === "all" || item.type === filterType)
    .filter((item) => filterStatus === "all" || item.status === filterStatus)
    .filter((item) => item.title.includes(searchQuery) || item.author.includes(searchQuery))

  const handleCreate = async () => {
    setIsSaving(true)

    const status = newScheduleDate ? "scheduled" : "published"
    const result = await createContentAction({
      type: newType,
      title: newTitle,
      authorName: newAuthor,
      body: newBody || undefined,
      url: newType === "external" ? newUrl : (newType === "video" ? newVideoUrl : undefined),
      thumbnailUrl: thumbnailUrl || undefined,
      status,
      publishDate: newScheduleDate || undefined,
      premium: newIsPremium,
      requiredRank: newIsPremium ? newRequiredRank : "all",
    })

    setIsSaving(false)

    if ("error" in result) {
      toast({ title: "エラー", description: result.error, variant: "destructive" })
      return
    }

    if (result.data) {
      const c = result.data
      setContents((prev) => [{
        id: c.id,
        type: c.type as ContentType,
        title: c.title,
        description: c.description || "",
        body: c.body || "",
        status: c.status as ContentStatus,
        publishDate: c.publish_date || "",
        author: c.author_name,
        thumbnail: c.thumbnail_url || undefined,
        views: c.views,
        premium: c.premium,
        requiredRank: (c.required_rank as MemberRank) || "all",
        url: c.url || undefined,
        duration: c.duration || undefined,
      }, ...prev])
    }

    toast({ title: "保存完了", description: "新しいコンテンツを保存しました。" })
    resetForm()
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const result = await deleteContentAction(id)
    if ("error" in result) {
      toast({ title: "エラー", description: result.error, variant: "destructive" })
    } else {
      setContents((prev) => prev.filter((c) => c.id !== id))
      toast({ title: "削除完了", description: "コンテンツを削除しました。", variant: "destructive" })
    }
    setDeletingId(null)
  }

  const resetForm = () => {
    setShowCreateForm(false)
    setNewType("article")
    setNewTitle("")
    setNewAuthor("")
    setNewBody("")
    setNewUrl("")
    setNewVideoUrl("")
    setNewScheduleDate("")
    setNewIsPremium(false)
    setNewRequiredRank("all")
    setThumbnailUrl(null)
  }

  return (
    <div className="space-y-8">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg text-[#1B3022]">{"コンテンツ管理"}</h3>
          <p className="text-xs text-[#1B3022]/40 mt-1">{`${items.length}件のコンテンツ`}</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B3022] gap-2"
        >
          <Plus className="w-4 h-4" />
          {"新規作成"}
        </Button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="rounded-xl border-2 border-[#D4AF37]/30 bg-background p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg text-[#1B3022]">{"新規コンテンツ作成"}</h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-[#1B3022]/30 hover:text-[#1B3022] transition-colors"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content type selector */}
          <div className="space-y-2">
            <Label className="text-xs text-[#1B3022]/50">{"コンテンツタイプ"}</Label>
            <div className="flex items-center gap-2">
              {(["article", "video", "external"] as ContentType[]).map((type) => {
                const config = typeConfig[type]
                const Icon = config.icon
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewType(type)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors border",
                      newType === type
                        ? "border-[#D4AF37] bg-[#D4AF37]/5 text-[#1B3022]"
                        : "border-[#1B3022]/8 text-[#1B3022]/40 hover:border-[#1B3022]/20"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-[#1B3022]/50">{"タイトル"}</Label>
              <Input
                placeholder="コンテンツのタイトル"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-11 border-[#1B3022]/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#1B3022]/50">{"著者 / 制作者"}</Label>
              <Input
                placeholder="著者名"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                className="h-11 border-[#1B3022]/10"
              />
            </div>
          </div>

          {/* Type-specific fields */}
          {newType === "article" && (
            <div className="space-y-2">
              <Label className="text-xs text-[#1B3022]/50">{"記事本文"}</Label>
              <MarkdownEditor
                value={newBody}
                onChange={setNewBody}
                placeholder="Markdownで記事の本文を入力..."
                minHeight="280px"
              />
            </div>
          )}

          {newType === "video" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-[#1B3022]/50">{"動画URL / アップロード"}</Label>
                <div className="flex gap-3">
                  <Input
                    placeholder="YouTube URL またはアップロード済み動画URL"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    className="h-11 border-[#1B3022]/10 flex-1"
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="h-11 border-[#1B3022]/10 text-[#1B3022]/50 gap-2 bg-transparent"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploadingVideo}
                  >
                    {isUploadingVideo ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {"アップロード中..."}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        {"アップロード"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-[#1B3022]/50">{"動画の説明"}</Label>
                <Textarea
                  placeholder="動画の説明文..."
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="min-h-[100px] border-[#1B3022]/10 resize-none"
                />
              </div>
            </div>
          )}

          {newType === "external" && (
            <div className="space-y-2">
              <Label className="text-xs text-[#1B3022]/50">{"外部リンクURL"}</Label>
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#1B3022]/30 shrink-0" />
                <Input
                  placeholder="https://example.com/article"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="h-11 border-[#1B3022]/10"
                />
              </div>
              <div className="space-y-2 mt-3">
                <Label className="text-xs text-[#1B3022]/50">{"紹介文（任意）"}</Label>
                <Textarea
                  placeholder="このリンクの紹介文..."
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="min-h-[80px] border-[#1B3022]/10 resize-none"
                />
              </div>
            </div>
          )}

          {/* Schedule & Premium settings */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-[#1B3022]/50">{"配信予約日時"}</Label>
              <Input
                type="datetime-local"
                value={newScheduleDate}
                onChange={(e) => setNewScheduleDate(e.target.value)}
                className="h-11 border-[#1B3022]/10"
              />
              <p className="text-[10px] text-[#1B3022]/30">{"空欄の場合は下書きとして保存"}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#1B3022]/50">{"サムネイル画像"}</Label>
              {thumbnailUrl ? (
                <div className="relative h-24 rounded-lg overflow-hidden border border-[#1B3022]/10">
                  <Image src={thumbnailUrl} alt="サムネイル" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl(null)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="h-20 border border-dashed border-[#1B3022]/15 rounded-lg flex flex-col items-center justify-center gap-1 text-xs text-[#1B3022]/40 cursor-pointer hover:border-[#D4AF37]/40 transition-colors">
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {"画像を選択（5MB以下）"}
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setIsUploading(true)
                      const fd = new FormData()
                      fd.append("file", file)
                      const result = await uploadThumbnail(fd)
                      setIsUploading(false)
                      if ("url" in result) {
                        setThumbnailUrl(result.url)
                      } else {
                        toast({ title: "エラー", description: result.error, variant: "destructive" })
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Premium / Access Restriction */}
          <div className="rounded-xl bg-[#1B3022]/3 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#D4AF37]" />
                <div>
                  <p className="text-sm font-medium text-[#1B3022]">{"プレミアムコンテンツ"}</p>
                  <p className="text-[10px] text-[#1B3022]/40 mt-0.5">{"会員ランクに応じた閲覧制限を設定"}</p>
                </div>
              </div>
              <Switch
                checked={newIsPremium}
                onCheckedChange={setNewIsPremium}
              />
            </div>

            {newIsPremium && (
              <div className="space-y-3 pt-2 border-t border-[#1B3022]/8">
                <Label className="text-xs text-[#1B3022]/50">{"必要な会員ランク"}</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(["standard", "gold", "platinum", "diamond"] as MemberRank[]).map((rank) => (
                    <button
                      key={rank}
                      type="button"
                      onClick={() => setNewRequiredRank(rank)}
                      className={cn(
                        "px-3 py-2.5 rounded-lg text-xs text-center transition-colors border",
                        newRequiredRank === rank
                          ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] font-medium"
                          : "border-[#1B3022]/8 text-[#1B3022]/40 hover:border-[#1B3022]/20"
                      )}
                    >
                      {rankLabels[rank]}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#1B3022]/30 leading-relaxed">
                  {"選択したランク以上の会員のみがこのコンテンツを閲覧できます。ランク未達の会員にはロックアイコンとアップグレード案内が表示されます。"}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={resetForm}
              className="text-[#1B3022]/50 border-[#1B3022]/10 bg-transparent"
            >
              {"キャンセル"}
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-[#1B3022]/10 text-[#1B3022]/60 bg-transparent"
                onClick={() => {
                  setNewScheduleDate("")
                  handleCreate()
                }}
                disabled={isSaving || !newTitle}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {"保存中..."}
                  </>
                ) : (
                  "下書き保存"
                )}
              </Button>
              <Button
                onClick={handleCreate}
                className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B3022] gap-2"
                disabled={isSaving || !newTitle}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {"処理中..."}
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    {newScheduleDate ? "予約配信する" : "公開する"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1B3022]/30" />
          <Input
            placeholder="タイトルまたは著者で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-background border-[#1B3022]/10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={(v) => setFilterType(v as "all" | ContentType)}>
            <SelectTrigger className="w-32 h-10 text-xs border-[#1B3022]/10">
              <SelectValue placeholder="タイプ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{"すべて"}</SelectItem>
              <SelectItem value="article">{"記事"}</SelectItem>
              <SelectItem value="video">{"動画"}</SelectItem>
              <SelectItem value="external">{"外部リンク"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as "all" | ContentStatus)}>
            <SelectTrigger className="w-32 h-10 text-xs border-[#1B3022]/10">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{"すべて"}</SelectItem>
              <SelectItem value="draft">{"下書き"}</SelectItem>
              <SelectItem value="scheduled">{"予約中"}</SelectItem>
              <SelectItem value="published">{"公開済"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {(["article", "video", "external"] as ContentType[]).map((type) => {
          const config = typeConfig[type]
          const Icon = config.icon
          const count = items.filter((i) => i.type === type).length
          const publishedCount = items.filter((i) => i.type === type && i.status === "published").length
          return (
            <div key={type} className="p-4 rounded-xl border border-[#1B3022]/8 bg-background">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-[#1B3022]/30">{`${publishedCount}件公開中`}</span>
              </div>
              <p className="text-2xl font-serif text-[#1B3022]">{count}</p>
              <p className="text-xs text-[#1B3022]/40 mt-0.5">{config.label}</p>
            </div>
          )
        })}
      </div>

      {/* Content List */}
      <div className="space-y-2">
        {filtered.map((item) => {
          const config = typeConfig[item.type]
          const Icon = config.icon
          const statusConf = statusConfig[item.status]
          return (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-[#1B3022]/8 bg-background hover:border-[#1B3022]/15 transition-colors"
            >
              {/* Type icon */}
              <div className={cn("shrink-0 w-10 h-10 rounded-lg flex items-center justify-center", config.color)}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#1B3022] truncate">{item.title}</p>
                  {item.premium && (
                    <span className="shrink-0 flex items-center gap-1 text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" />
                      {rankLabels[item.requiredRank]}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-[#1B3022]/40">
                  <span>{item.author}</span>
                  {item.publishDate && (
                    <>
                      <span>{" / "}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.publishDate}
                      </span>
                    </>
                  )}
                  {item.status === "published" && (
                    <>
                      <span>{" / "}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {`${item.views.toLocaleString()}回`}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "削除"
                  )}
                </Button>
                {/* Status badge */}
                <Badge className={cn("shrink-0", statusConf.color, `hover:${statusConf.color}`)}>
                  {item.status === "published" && <Check className="w-3 h-3 mr-1" />}
                  {item.status === "scheduled" && <Clock className="w-3 h-3 mr-1" />}
                  {statusConf.label}
                </Badge>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-[#1B3022]/30">
            {"該当するコンテンツが見つかりません"}
          </div>
        )}
      </div>
    </div>
  )
}
