export interface ReviewUser {
    id: number
    name: string
    avatar_url?: string | null
}

export interface Review {
    id: number
    rating: number
    comment: string | null
    is_approved: boolean
    approved_at: string | null
    created_at: string
    user: ReviewUser
    course?: {
        id: number
        title: string
        slug: string
    }
}

export interface RatingDistribution {
    star: number
    count: number
    percentage: number
}

export interface RatingStats {
    average: number
    total: number
    distribution: RatingDistribution[]
}

export interface Comment {
    id: number
    body: string
    parent_id: number | null
    is_approved?: boolean
    created_at: string
    updated_at: string
    user: ReviewUser
    replies?: Comment[]
    course?: {
        id: number
        title: string
        slug: string
    }
}
