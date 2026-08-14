import Title from "@/components/atoms/Title"
import Badge from "@/components/atoms/Badge"

const stats = [
  { value: "2019", label: "Founded" },
  { value: "50K+", label: "Active Learners" },
  { value: "200+", label: "Courses Available" },
  { value: "98%", label: "Satisfaction Rate" },
]

export default function AboutSection() {
  return (
    <section className="bg-[#1a1a1a] text-white" id="about">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        <div className="flex flex-col gap-6">
          <Badge variant="purple" dot>
            About Us
          </Badge>

          <Title as="h2" className="text-white leading-tight" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>
            We're here to transform the way people learn
          </Title>

          <p className="text-gray-400 text-lg leading-relaxed">
            KursusIO was born from the belief that quality education should be accessible to everyone,
            everywhere. We bring together the best instructors, industry-relevant curriculum,
            and a community that supports each other.
          </p>

          <p className="text-gray-500 leading-relaxed">
            Since 2019, we've helped tens of thousands of learners develop their digital skills
            and land their dream jobs — from local startups to Fortune 500 companies.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px bg-gray-700">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#1a1a1a] p-6 lg:p-10 flex flex-col gap-2">
              <span className="text-3xl lg:text-4xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>
                {s.value}
              </span>
              <span className="text-sm text-gray-500 uppercase tracking-widest">
                {s.label}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
