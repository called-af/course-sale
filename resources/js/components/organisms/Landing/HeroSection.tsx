import { useState, useEffect } from "react"
import Button from "@/components/atoms/Button"
import Title from "@/components/atoms/Title"
import Badge from "@/components/atoms/Badge"
import { ArrowRight, Play } from "lucide-react"

const photos = [
  { src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80&fit=crop", span: "col-span-2 row-span-2" },
  { src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&q=80&fit=crop", span: "col-span-1 row-span-1" },
  { src: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&q=80&fit=crop", span: "col-span-1 row-span-1" },
  { src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80&fit=crop", span: "col-span-1 row-span-1" },
  { src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&fit=crop", span: "col-span-2 row-span-1" },
]

const avatars = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80&fit=crop&crop=face",
]

const BentoGrid = ({ rowHeight }: { rowHeight: number }) => (
  <div
    className="grid w-full gap-1"
    style={{
      gridTemplateColumns: "repeat(3, 1fr)",
      gridTemplateRows: `repeat(3, ${rowHeight}px)`,
    }}
  >
    {photos.map((p, i) => (
      <div key={i} className={`${p.span} overflow-hidden`}>
        <img src={p.src} alt="" className="w-full h-full object-cover" />
      </div>
    ))}
  </div>
)

export default function HeroSection() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t) }, [])

  return (
    <section className="min-h-screen bg-[#FAFAF8] dark:bg-[#0f0f0f] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between min-h-screen">

        <div
          className="flex flex-col gap-6 flex-1 max-w-xl w-full min-w-0 py-20 lg:py-0"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.7s ease, transform 0.7s ease"
          }}
        >
          <Badge variant="purple" dot>
            Indonesia's #1 Learning Platform
          </Badge>

          <div>
            <Title as="h1" className="leading-none" style={{ fontSize: "clamp(2.8rem,6vw,5rem)", lineHeight: 1.05 }}>
              Master Skills
            </Title>
            <Title as="h1" className="leading-none bg-purple-400 inline-block px-2 mt-1"
              style={{ fontSize: "clamp(2.8rem,6vw,5rem)", lineHeight: 1.1 }}>
              With Expert.
            </Title>
          </div>

          <div className="lg:hidden w-full overflow-hidden">
            <BentoGrid rowHeight={90} />
          </div>

          <p className="text-gray-500 dark:text-slate-400 lg:text-lg text-sm max-w-lg leading-relaxed">
            Join thousands of learners who have transformed their careers through
            high-quality courses and experienced mentors.
          </p>

          <div className="flex flex-col lg:flex-row items-center gap-4">
            <Button widthFull variant="primary" rightIcon={<ArrowRight size={18} />} className="px-8 py-3 text-base bg-gray-900 hover:bg-gray-700 focus:ring-gray-500">
              Explore Courses
            </Button>
            <Button widthFull variant="outline" leftIcon={<Play size={18} />} className="px-6 py-3 text-base">
              Watch Demo
            </Button>
          </div>

          <div className="flex items-center gap-6 pt-8 border-t border-gray-200 dark:border-slate-700 w-fit">
            <div className="flex items-center">
              {avatars.map((src, i) => (
                <img key={i} src={src} alt="" className="w-9 h-9 object-cover rounded-full ring-2 ring-white dark:ring-slate-900"
                  style={{ marginLeft: i === 0 ? 0 : "-10px" }} />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1 text-amber-400 text-sm">
                {"★★★★★"}
                <span className="text-gray-900 dark:text-white font-semibold ml-1">4.9</span>
              </div>
              <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                from <span className="text-gray-700 dark:text-slate-300 font-medium">50,000+</span> active learners
              </div>
            </div>
          </div>
        </div>

        <div
          className="hidden lg:grid flex-1 max-w-lg gap-2"
          style={{
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "repeat(3, 160px)",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateX(0)" : "translateX(24px)",
            transition: "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s"
          }}
        >
          {photos.map((p, i) => (
            <div key={i} className={`${p.span} overflow-hidden`}>
              <img src={p.src} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
