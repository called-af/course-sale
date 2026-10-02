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
    <div className="bg-[#222222] dark:bg-slate-800/60 p-6 flex flex-col gap-4">

      {/* Rating */}
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < rating ? "text-amber-400" : "text-gray-700 dark:text-slate-600"}>★</span>
        ))}
      </div>

      {/* Comment */}
      <p className="text-gray-400 dark:text-slate-400 text-sm leading-relaxed flex-1">
        "{comment}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-800 dark:border-slate-700">
        <img src={avatar} alt={name} className="w-9 h-9 object-cover" />
        <div>
          <div className="text-sm font-semibold text-white">{name}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">{role}</div>
        </div>
      </div>

    </div>
  )
}
