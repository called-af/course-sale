import { Head } from '@inertiajs/react'
import WelcomeLayout from '@/components/templates/WelcomeLayout'

import HeroSection from '@/components/organisms/Landing/HeroSection'
import AboutSection from '@/components/organisms/Landing/AboutSection'
import CourseSection from '@/components/organisms/Landing/CourseSection'
import TestimonialSection from '@/components/organisms/Landing/TestimoniSection'
import CtaSection from '@/components/organisms/Landing/CtaSection'
import CategorySection from '@/components/organisms/Landing/CategorySection'

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