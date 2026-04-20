export interface MaterialContent {
  id: number
  material_id: number
  title: string
  type: "video" | "text" | "quiz" | "file" | "ppt"
  content_url?: string | null
  content_text?: JSON | null
  duration?: number | null
  sort_order: number
  status: "draft" | "published"

  created_at?: string
  updated_at?: string
}