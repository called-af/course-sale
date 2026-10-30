import { useState, useCallback } from 'react'
import { MessageSquare, Reply, Trash2, Pencil, Send, UserRound } from 'lucide-react'
import Button from '@/components/atoms/Button'
import type { Comment } from '@/types'

interface CommentThreadProps {
    comments: Comment[]
    courseSlug: string
    currentUserId?: number
}

interface CommentFormProps {
    courseSlug: string
    parentId?: number | null
    defaultValue?: string
    placeholder?: string
    submitLabel?: string
    onSuccess?: (comment: Comment) => void
    onCancel?: () => void
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h ago`
    const diffD = Math.floor(diffH / 24)
    if (diffD < 7) return `${diffD}d ago`
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function CommentForm({ courseSlug, parentId, defaultValue = '', placeholder, submitLabel, onSuccess, onCancel }: CommentFormProps) {
    const [body, setBody] = useState(defaultValue)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!body.trim() || body.trim().length < 3) {
            setError('Comment must be at least 3 characters.')
            return
        }
        setError('')
        setSubmitting(true)

        try {
            const url = parentId !== undefined && parentId !== null
                ? `/student/courses/${courseSlug}/comments`
                : `/student/courses/${courseSlug}/comments`

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ body: body.trim(), parent_id: parentId ?? null }),
            })

            const data = await res.json()
            if (data.success) {
                setBody('')
                onSuccess?.(data.comment)
            } else {
                setError(data.message ?? 'Something went wrong.')
            }
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            <textarea
                value={body}
                onChange={(e) => { setBody(e.target.value); setError('') }}
                placeholder={placeholder ?? 'Write a comment...'}
                rows={3}
                maxLength={2000}
                className="w-full border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-purple-500 dark:focus:ring-purple-900/50"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex items-center gap-2">
                <Button type="submit" size="sm" isLoading={submitting} leftIcon={<Send size={13} />}>
                    {submitLabel ?? 'Post Comment'}
                </Button>
                {onCancel && (
                    <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{body.length}/2000</span>
            </div>
        </form>
    )
}

interface CommentItemProps {
    comment: Comment
    courseSlug: string
    currentUserId?: number
    isReply?: boolean
}

function CommentItem({ comment, courseSlug, currentUserId, isReply = false }: CommentItemProps) {
    const [replies, setReplies] = useState<Comment[]>(comment.replies ?? [])
    const [showReplyForm, setShowReplyForm] = useState(false)
    const [editing, setEditing] = useState(false)
    const [body, setBody] = useState(comment.body)
    const [deleted, setDeleted] = useState(false)

    const isOwner = currentUserId === comment.user.id

    const handleReplySuccess = useCallback((newComment: Comment) => {
        setReplies((prev) => [...prev, newComment])
        setShowReplyForm(false)
    }, [])

    const handleEditSuccess = useCallback((updated: { body: string }) => {
        setBody(updated.body)
        setEditing(false)
    }, [])

    const handleDelete = async () => {
        if (!confirm('Delete this comment?')) return

        try {
            const res = await fetch(`/student/courses/${courseSlug}/comments/${comment.id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                    'Accept': 'application/json',
                },
            })
            const data = await res.json()
            if (data.success) setDeleted(true)
        } catch {
            alert('Failed to delete comment.')
        }
    }

    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const newBody = (form.elements.namedItem('body') as HTMLTextAreaElement).value.trim()
        if (!newBody) return

        try {
            const res = await fetch(`/student/courses/${courseSlug}/comments/${comment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ body: newBody }),
            })
            const data = await res.json()
            if (data.success) handleEditSuccess(data.comment)
        } catch {
            alert('Failed to update comment.')
        }
    }

    if (deleted) return null

    return (
        <div className={isReply ? 'ml-10 border-l-2 border-slate-100 pl-4 dark:border-slate-800' : ''}>
            <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-slate-100 dark:bg-slate-700">
                    {comment.user.avatar_url ? (
                        <img src={comment.user.avatar_url} alt={comment.user.name} className="h-8 w-8 object-cover" />
                    ) : (
                        <UserRound size={15} className="text-slate-500 dark:text-slate-400" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{comment.user.name}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(comment.created_at)}</span>
                        {comment.updated_at !== comment.created_at && (
                            <span className="text-xs text-slate-300 dark:text-slate-600">(edited)</span>
                        )}
                    </div>

                    {editing ? (
                        <form onSubmit={handleEditSubmit} className="mt-2 space-y-2">
                            <textarea
                                name="body"
                                defaultValue={body}
                                rows={2}
                                maxLength={2000}
                                autoFocus
                                className="w-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-200 dark:focus:border-purple-500 dark:focus:ring-purple-900/50"
                            />
                            <div className="flex gap-2">
                                <Button type="submit" size="sm">Save</Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                            </div>
                        </form>
                    ) : (
                        <p className="mt-1 text-sm text-slate-600 leading-relaxed dark:text-slate-300">{body}</p>
                    )}

                    <div className="mt-2 flex items-center gap-3">
                        {!isReply && currentUserId && (
                            <button
                                type="button"
                                onClick={() => setShowReplyForm((v) => !v)}
                                className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-purple-600 transition-colors dark:text-slate-500 dark:hover:text-purple-400"
                            >
                                <Reply size={13} /> Reply
                            </button>
                        )}
                        {isOwner && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setEditing((v) => !v)}
                                    className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-purple-600 transition-colors dark:text-slate-500 dark:hover:text-purple-400"
                                >
                                    <Pencil size={12} /> Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors dark:text-slate-500 dark:hover:text-red-400"
                                >
                                    <Trash2 size={12} /> Delete
                                </button>
                            </>
                        )}
                    </div>

                    {showReplyForm && (
                        <div className="mt-3">
                            <CommentForm
                                courseSlug={courseSlug}
                                parentId={comment.id}
                                placeholder={`Reply to ${comment.user.name}...`}
                                submitLabel="Post Reply"
                                onSuccess={handleReplySuccess}
                                onCancel={() => setShowReplyForm(false)}
                            />
                        </div>
                    )}

                    {replies.length > 0 && (
                        <div className="mt-3 space-y-3">
                            {replies.map((reply) => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    courseSlug={courseSlug}
                                    currentUserId={currentUserId}
                                    isReply
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function CommentThread({ comments: initialComments, courseSlug, currentUserId }: CommentThreadProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments)

    const handleNewComment = useCallback((comment: Comment) => {
        setComments((prev) => [comment, ...prev])
    }, [])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-purple-600" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Discussion <span className="text-slate-400 font-normal dark:text-slate-500">({comments.length})</span>
                </h3>
            </div>

            {/* New comment form */}
            {currentUserId ? (
                <div className="border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <p className="mb-3 text-xs font-semibold text-slate-600 uppercase tracking-wide dark:text-slate-300">Start a discussion</p>
                    <CommentForm
                        courseSlug={courseSlug}
                        onSuccess={handleNewComment}
                        placeholder="Ask a question or share your thoughts..."
                    />
                </div>
            ) : (
                <div className="border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-400">
                    <a href="/login" className="font-medium text-purple-600 hover:underline dark:text-purple-400">Sign in</a> to join the discussion.
                </div>
            )}

            {/* Comments list */}
            {comments.length === 0 ? (
                <div className="py-10 text-center text-slate-400 dark:text-slate-500">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No discussion yet. Be the first to post!</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            courseSlug={courseSlug}
                            currentUserId={currentUserId}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
