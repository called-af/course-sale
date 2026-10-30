import { ArrowUpRight, Sparkles } from 'lucide-react';
import React from 'react';
import ChatAvatar from '@/components/ai/ChatAvatar';
import CourseComparison from '@/components/ai/CourseComparison';
import CourseRecommendationCard from '@/components/ai/CourseRecommendationCard';
import LearningPath from '@/components/ai/LearningPath';
import MarkdownResponse from '@/components/ai/MarkdownResponse';
import type { ChatMessageData, CourseSummary, StructuredChatContent } from '@/components/ai/types';

interface ChatMessageBubbleProps {
    message: ChatMessageData;
}

function parseStructuredContent(content: string | null | undefined): StructuredChatContent {
    if (!content) return {};

    try {
        const parsed = JSON.parse(content) as StructuredChatContent;
        if (!parsed || typeof parsed !== 'object') return {};
        return parsed;
    } catch {
        return {};
    }
}

function parseMarkdownRecommendations(content: string | null | undefined): CourseSummary[] {
    if (!content) return [];

    const listIds = Array.from(content.matchAll(/-\s*\*\*ID:\*\*\s*([0-9]+)/gi)).map((match) => match[1]);
    const listTitles = Array.from(content.matchAll(/-\s*\*\*Judul:\*\*\s*(.+?)(?=\n|$)/gi)).map((match) => match[1].trim());
    const listRecommendations = listIds.map((id, index) => ({
        id: Number(id),
        title: listTitles[index] || `Kursus ${id}`,
    }));

    if (listRecommendations.length > 0) return listRecommendations;

    const tableLines = content.split(/\r?\n/);
    const headerIndex = tableLines.findIndex((line) => {
        const cells = line.split('|').map((cell) => cell.trim().toLowerCase());
        return cells.includes('id') && cells.includes('judul');
    });

    if (headerIndex < 0) return [];

    const rows = tableLines.slice(headerIndex + 2).filter((line) => line.trim().startsWith('|'));
    const courses: CourseSummary[] = [];

    rows.forEach((line) => {
        const cells = line.split('|').map((cell) => cell.trim());
        const id = cells[1]?.replace(/[^0-9]/g, '');
        const title = cells[2]?.trim();

        if (id && title) {
            courses.push({ id: Number(id), title });
        }
    });

    return courses;
}

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
    const isUser = message.role === 'user';
    const structured = !isUser ? parseStructuredContent(message.content) : {};
    const markdownContent = structured.content ?? message.content;
    const structuredRecommendations = structured.recommendations?.length ? structured.recommendations : structured.courses;
    const recommendations = isUser
        ? []
        : structuredRecommendations?.length
          ? structuredRecommendations
          : parseMarkdownRecommendations(message.content);

    return (
        <article
            className={`group flex w-full items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            aria-label={isUser ? 'Your message' : 'AI response'}
        >
            <ChatAvatar role={message.role} size="sm" />
            <div className={`max-w-[calc(100%-3rem)] min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
                <div className={`mb-1.5 flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">{isUser ? 'You' : 'Course AI'}</span>
                    {isUser ? null : <Sparkles className="h-3 w-3 text-purple-500" />}
                </div>
                <div
                    className={`overflow-hidden border px-4 py-3 shadow-sm transition-shadow group-hover:shadow-md ${
                        isUser
                            ? 'border-purple-200 bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-purple-500/10'
                            : 'border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                >
                    {markdownContent ? (
                        <MarkdownResponse
                            content={markdownContent}
                            variant={isUser ? 'inverted' : 'default'}
                            className={`ai-markdown ${isUser ? 'text-white' : ''}`}
                        />
                    ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">AI belum memberikan hasil.</p>
                    )}

                    {recommendations.length > 0 && (
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Rekomendasi course</h3>
                            </div>
                            {recommendations.map((course, index) => (
                                <CourseRecommendationCard key={`${course.id}-${index}`} course={course} />
                            ))}
                        </div>
                    )}

                    {structured.comparison && structured.comparison.length > 0 && <CourseComparison comparisonData={structured.comparison} />}

                    {structured.learning_path && structured.learning_path.length > 0 && <LearningPath pathData={structured.learning_path} />}
                </div>
                {isUser ? (
                    <a
                        href="#"
                        className="mt-2 hidden items-center gap-1 text-[11px] text-slate-400 group-hover:flex hover:text-purple-600 dark:hover:text-purple-400"
                    >
                        Pesan disimpan <ArrowUpRight className="h-3 w-3" />
                    </a>
                ) : null}
            </div>
        </article>
    );
}
