import { Module } from "@/types/modules"

export interface CertificateTemplateData {
  primary_color?: string
  accent_color?: string
  bg_style?: 'dark' | 'light' | 'gradient'
  show_signature?: boolean
  signature_name?: string
  custom_title?: string
  footer_note?: string
}

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

  tags?: {
    id: number
    name: string
    slug?: string
  }[]

  certificate_template?: CertificateTemplateData | null
}