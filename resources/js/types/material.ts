import { MaterialContent } from "./material-content"

export interface Material {
  module: any
  contents: MaterialContent[]
  id: number
  module_id: number
  title: string
  description?: string | null
  sort_order: number

  created_at?: string
  updated_at?: string
}