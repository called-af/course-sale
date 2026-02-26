export type User = {
  id: number
  name: string
  email: string
  role: "student" | "instructor" | "admin"
  avatar_url?: string | null
}