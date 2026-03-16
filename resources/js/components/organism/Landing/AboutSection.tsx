import Title from "@/components/atoms/Title"
import Badge from "@/components/atoms/Badge"

const stats = [
  { value: "2019", label: "Tahun Berdiri" },
  { value: "50K+", label: "Pelajar Aktif" },
  { value: "200+", label: "Kursus Tersedia" },
  { value: "98%", label: "Tingkat Kepuasan" },
]

export default function AboutSection() {
  return (
    <section className="bg-[#1a1a1a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        <div className="flex flex-col gap-6">
          <Badge variant="purple" dot>
            Tentang Kami
          </Badge>

          <Title as="h2" className="text-white leading-tight" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>
            Kami hadir untuk mengubah cara belajar Indonesia
          </Title>

          <p className="text-gray-400 text-lg leading-relaxed">
            KursusIO lahir dari keyakinan bahwa pendidikan berkualitas harus bisa diakses siapa saja,
            di mana saja. Kami menghadirkan instruktur terbaik, kurikulum yang relevan dengan industri,
            dan komunitas yang saling mendukung.
          </p>

          <p className="text-gray-500 leading-relaxed">
            Sejak 2019, kami telah membantu puluhan ribu pelajar mengembangkan skill digital mereka
            dan berhasil masuk ke perusahaan impian — dari startup lokal hingga perusahaan Fortune 500.
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