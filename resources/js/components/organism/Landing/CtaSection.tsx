// @/components/organism/Landing/CtaSection.tsx

import { Link } from "@inertiajs/react"
import Title from "@/components/atoms/Title"
import Button from "@/components/atoms/Button"
import { ArrowRight } from "lucide-react"

export default function CtaSection() {
  return (
    <section className="bg-[#FAFAF8] py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        <div className="bg-[#1a1a1a] px-8 sm:px-16 py-16 sm:py-20 flex flex-col lg:flex-row items-center justify-between gap-10">

          {/* Left */}
          <div className="flex flex-col gap-4 max-w-xl">
            <Title as="h2" className="text-white leading-tight" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)" }}>
              Mulai perjalanan belajarmu
              <span className="bg-purple-400 px-2 ml-2 inline-block text-gray-900">hari ini.</span>
            </Title>
            <p className="text-gray-500 leading-relaxed">
              Bergabung dengan 50.000+ pelajar yang telah membuktikan sendiri. Akses ratusan kursus premium tanpa batas.
            </p>
          </div>

          {/* Right */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                variant="primary"
                widthFull
                rightIcon={<ArrowRight size={18} />}
                className="px-8 py-3 text-base whitespace-nowrap"
              >
                Daftar Gratis
              </Button>
            </Link>
            <Link href="/courses" className="w-full sm:w-auto">
              <Button
                variant="outline"
                widthFull
                className="px-8 py-3 text-base whitespace-nowrap"
              >
                Lihat Kursus
              </Button>
            </Link>
          </div>

        </div>

      </div>
    </section>
  )
}