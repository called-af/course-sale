import Title from "@/components/atoms/Title"
import Badge from "@/components/atoms/Badge"
import Button from "@/components/atoms/Button"
import { Link } from "@inertiajs/react"
import { ArrowRight } from "lucide-react"

import { CategorySectionProps } from "@/types/category"

export default function CategorySection({ categories }: CategorySectionProps) {
  return (
    <section className="bg-[#FAFAF8] py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="flex flex-col gap-4">
            <Badge variant="purple" dot>
              Career Paths
            </Badge>
            <Title
              as="h2"
              className="leading-tight"
              style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)" }}
            >
              Choose the Career Path
              <span className="bg-purple-400 px-2 ml-2 inline-block">
                You Want
              </span>
            </Title>
          </div>

          <p className="text-gray-400 text-sm max-w-xs lg:text-right leading-relaxed">
            Each path is designed with industry practitioners to ensure you're job-ready.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
          {categories.map((c) => (
            <div
              key={c.id}
              className="bg-[#FAFAF8] p-8 flex flex-col gap-4 group hover:bg-white transition-colors"
            >
              {c.img_url ? (
                <img src={c.img_url} className="w-10 h-10 object-cover" />
              ) : (
                <span className="text-3xl">📚</span>
              )}

              <div className="flex flex-col gap-1">
                <Title as="h4" className="text-gray-900">
                  {c.name}
                </Title>
                <span className="text-xs text-purple-500 font-medium uppercase tracking-widest">
                  Category
                </span>
              </div>

              <p className="text-gray-500 text-sm leading-relaxed">
                {c.desc ?? "Explore a variety of courses in this category."}
              </p>

              <div className="mt-auto pt-4">
                <Link
                  href={`/courses?category=${c.slug}`}
                  className="inline-flex items-center gap-1 text-sm text-gray-400 group-hover:text-purple-600 transition-colors"
                >
                  View Courses <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 flex justify-center">
          <Link href="/courses">
            <Button
              variant="outline"
              rightIcon={<ArrowRight size={16} />}
              className="px-8 py-3 text-base"
            >
              Explore All Paths
            </Button>
          </Link>
        </div>

      </div>
    </section>
  )
}
