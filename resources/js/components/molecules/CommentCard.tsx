// @/components/molecules/CommentCard.tsx

interface CommentCardProps {
  name: string
  role: string
  avatar: string
  comment: string
  rating: number
}

export default function CommentCard({ name, role, avatar, comment, rating }: CommentCardProps) {
  return (
    <div className="bg-white dark:bg-[#141416] p-6 flex flex-col gap-4 rounded-lg border border-gray-100 dark:border-transparent">

      {/* Rating */}
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < rating ? "text-amber-400" : "text-gray-300 dark:text-gray-700"}>★</span>
        ))}
      </div>

      {/* Comment */}
      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed flex-1">
        "{comment}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <img src={avatar} alt={name} className="w-9 h-9 object-cover" />
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{name}</div>
          <div className="text-xs text-gray-400 dark:text-slate-400">{role}</div>
        </div>
      </div>

    </div>
  )
}
