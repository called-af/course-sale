import { Module } from "@/types/modules"

export interface Course {
  id: number
  slug: string
  title: string
  description: string | null
  thumbnail_url: string
  level: string | null
  type: string
  status: string
  price?: number | null

  creator_id?: number
  creator?: {
    name: string
  }

  modules: Module[]

  categories: {
    id: number
    name: string
  }[]
}