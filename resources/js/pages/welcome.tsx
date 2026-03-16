import { Head } from '@inertiajs/react'
import WelcomeLayout from '@/components/templates/WelcomeLayout'

import HeroSection from '@/components/organism/Landing/HeroSection'
import AboutSection from '@/components/organism/Landing/AboutSection'
import CourseSection from '@/components/organism/Landing/CourseSection'
import TestimonialSection from '@/components/organism/Landing/TestimoniSection'
import CtaSection from '@/components/organism/Landing/CtaSection'
import CategorySection from '@/components/organism/Landing/CategorySection'

import { Course } from "@/types"
import { Category } from "@/types/category"

interface WelcomeProps {
  courses: Course[]
  categories: Category[]
}

export default function Welcome({ courses, categories }: WelcomeProps) {
  return (
    <>
      <Head title="Welcome to our digital course" />

      <HeroSection />
      <AboutSection />
      <CourseSection courses={courses} />
      <TestimonialSection />
      <CategorySection categories={categories} />
      <CtaSection />
    </>
  )
}

Welcome.layout = (page: React.ReactNode) => (
  <WelcomeLayout>{page}</WelcomeLayout>
)