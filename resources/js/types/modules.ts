import { Material } from "./material"

export interface Module {
  id: number
  course_id: number
  title: string
  sort_order: number

  course: {
    slug: string
  }

  materials?: Material[]
}