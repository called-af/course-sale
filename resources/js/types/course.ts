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
  creator?: {
    name: string
  }
  modules: Module[]
}