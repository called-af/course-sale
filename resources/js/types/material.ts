export interface Material {
  id: number
  module_id: number
  title: string
  description?: string | null
  sort_order: number
  is_preview: boolean

  created_at?: string
  updated_at?: string
}