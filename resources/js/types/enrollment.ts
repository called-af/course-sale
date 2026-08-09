import { Course } from "./course"
import { User } from "./user"

export interface Enrollment {
  id: number
  user_id: number
  course_id: number
  status: "active" | "revoked" | "expired"
  enrolled_at: string
  created_at?: string
  updated_at?: string

  course?: Course
  user?: User
}

export interface MaterialProgress {
  id: number
  user_id: number
  material_id: number
  is_completed: boolean
  completed_at: string | null
}
