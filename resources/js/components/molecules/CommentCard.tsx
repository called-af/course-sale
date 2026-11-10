import { Quote } from 'lucide-react';
import RatingStars from '@/components/atoms/RatingStars';

interface CommentCardProps {
    name: string;
    role: string;
    avatar: string;
    comment: string;
    rating: number;
}

export default function CommentCard({ name, role, avatar, comment, rating }: CommentCardProps) {
    return (
        <div className="relative flex h-full flex-col gap-4 overflow-hidden rounded-lg bg-white p-6 transition-colors duration-300 hover:bg-gray-50 dark:bg-[#1e1f24] dark:hover:bg-[#25262b]">
            {/* Accent line that grows on hover */}
            <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-purple-500 transition-transform duration-500 group-hover:scale-x-100"
            />

            {/* Decorative quote */}
            <Quote aria-hidden size={30} className="pointer-events-none absolute top-5 right-5 text-slate-100 dark:text-slate-800" />

            {/* Rating */}
            <RatingStars value={rating} size={13} />

            {/* Comment */}
            <p className="flex-1 text-sm leading-relaxed text-gray-600 dark:text-slate-300">"{comment}"</p>

            {/* Author */}
            <div className="flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-slate-700">
                <img src={avatar} alt={name} className="h-10 w-10 object-cover" />
                <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{name}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">{role}</div>
                </div>
            </div>
        </div>
    );
}
