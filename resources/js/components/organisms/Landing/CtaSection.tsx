import { Link } from "@inertiajs/react"
import Title from "@/components/atoms/Title"
import Button from "@/components/atoms/Button"
import { ArrowRight } from "lucide-react"

export default function CtaSection() {
  return (
    <section className="py-24 bg-white dark:bg-[#0f0f0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        <div className="bg-[#1a1a1a] dark:bg-slate-800 px-8 sm:px-16 py-16 sm:py-20 flex flex-col lg:flex-row items-center justify-between gap-10">

          <div className="flex flex-col gap-4 max-w-xl">
            <Title as="h2" className="text-white leading-tight" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)" }}>
              Start your learning journey
              <span className="bg-purple-400 px-2 inline-block text-gray-900">today.</span>
            </Title>
            <p className="text-gray-500 dark:text-slate-400 leading-relaxed">
              Join 50,000+ learners who have proven it for themselves. Access hundreds of premium courses with no limits.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                variant="primary"
                widthFull
                rightIcon={<ArrowRight size={18} />}
                className="px-8 py-3 text-base whitespace-nowrap"
              >
                Sign Up Free
              </Button>
            </Link>
            <Link href="/courses" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                widthFull
                className="px-8 py-3 text-base whitespace-nowrap"
              >
                Browse Courses
              </Button>
            </Link>
          </div>

        </div>

      </div>
    </section>
  )
}
