export type ContentType = "article" | "video" | "external"
export type ContentStatus = "draft" | "scheduled" | "published"
export type MemberRank = "all" | "standard" | "gold" | "platinum" | "diamond"

export interface Content {
    id: string
    type: ContentType
    title: string
    description?: string
    body?: string | string[] // For articles or descriptions
    status: ContentStatus
    publishDate: string
    author: string
    thumbnail?: string
    views: number
    likes?: number
    premium: boolean
    requiredRank: MemberRank
    url?: string // For external links or video URLs
    duration?: string // For videos
    authorBio?: string
    tags?: string[]
}

export interface UserStats {
    totalUsers: number
    activeRate: number
    monthlyNewUsers: number
    inviteConversionRate: number // 招待経由率
}

export interface GrowthData {
    month: string
    total: number
    invited: number
}

export interface WeeklyRegistrationData {
    day: string
    registrations: number
}

export interface AdminUser {
    id: string
    name: string
    email: string
    referrals: number
    clicks: number
    registrations: number
    status: "active" | "pending"
    joinDate: string
}

export interface Reward {
    id: string
    title: string
    requiredReferrals: number
    description: string
    icon: string
    status: "active" | "inactive"
}

export interface Broadcast {
    id: string
    title: string
    body: string
    targetRank: MemberRank | "all"
    sentAt: string
    status: "sent" | "failed" | "scheduled"
}
