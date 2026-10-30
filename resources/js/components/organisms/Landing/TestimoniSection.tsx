import Badge from "@/components/atoms/Badge"
import Title from "@/components/atoms/Title"
import CommentCard from "@/components/molecules/CommentCard"
import { useBranding } from "@/hooks/useBranding"

const testimonials = [
  {
    name: "Andi Wirawan",
    role: "Frontend Developer · Tokopedia",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80&fit=crop&crop=face",
    comment: "The courses here truly transformed my career. The content is industry-relevant and the instructors are very responsive.",
    rating: 5,
  },
  {
    name: "Sari Dewi",
    role: "UI/UX Designer · Gojek",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80&fit=crop&crop=face",
    comment: "After just 3 months on {brand}, I landed my dream job. The curriculum is well-structured and easy to follow.",
    rating: 5,
  },
  {
    name: "Rizky Pratama",
    role: "Data Analyst · Shopee",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80&fit=crop&crop=face",
    comment: "The best platform for learning digital skills. Affordable price but quality on par with expensive bootcamps.",
    rating: 4,
  },
  {
    name: "Maya Putri",
    role: "Backend Engineer · Bukalapak",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80&fit=crop&crop=face",
    comment: "I've tried many learning platforms, but {brand} is the one that made a real difference. The community is super active too.",
    rating: 5,
  },
  {
    name: "Budi Santoso",
    role: "Mobile Developer · Traveloka",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80&fit=crop&crop=face",
    comment: "Content is always up-to-date with the latest tech trends. The instructors are real practitioners, not just theorists.",
    rating: 5,
  },
  {
    name: "Nita Rahayu",
    role: "Product Manager · Grab",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&q=80&fit=crop&crop=face",
    comment: "The best investment I've ever made. The ROI was felt immediately after finishing my first course.",
    rating: 4,
  },
]

export default function TestimonialSection() {
  const { name } = useBranding()

  return (
    <section className="bg-[#141416] dark:bg-[#FAFAF8] py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        {/* Header */}
        <div className="flex flex-col gap-4 mb-12">
          <Badge variant="purple" dot>
            Testimonials
          </Badge>
          <Title as="h2" className="text-gray-100 dark:text-gray-900 leading-tight" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)" }}>
            What Our
            <span className="bg-purple-400 px-2 ml-2 inline-block text-white">Learners Say</span>
          </Title>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <CommentCard
              key={t.name}
              {...t}
              comment={t.comment.replaceAll("{brand}", name)}
            />
          ))}
        </div>

      </div>
    </section>
  )
}
