"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import ImageGrid from "./ImageGrid"

interface Confession {
    id: string
    content: string
    field: string | null
    position: string | null
    level: number | null
    is_anonymous: boolean
    created_at: string
    image_urls: string[]
}

interface Comment {
    id: string
    content: string
    is_anonymous: boolean
    created_at: string
    user_id: string
}

const REACTIONS = [
    { type: "like",    emoji: "❤️",  label: "Cảm thông" },
    { type: "empathy", emoji: "🤝",  label: "Đồng cảm" },
    { type: "brave",   emoji: "💪",  label: "Dũng cảm" },
    { type: "relate",  emoji: "😔",  label: "Tôi cũng vậy" }
]

export default function ConfessionDetail({
                                             confession,
                                             initialComments
                                         }: {
    confession: Confession
    initialComments: Comment[]
}) {
    const [userId, setUserId] = useState<string | null>(null)
    const [reactions, setReactions] = useState<Record<string, number>>({})
    const [userReactions, setUserReactions] = useState<string[]>([])
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [commentText, setCommentText] = useState("")
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [reacting, setReacting] = useState(false)

    useEffect(() => {
        const init = async () => {
            const { data: authData } = await supabase.auth.getUser()
            const uid = authData.user?.id ?? null
            setUserId(uid)

            const [{ data: reactionData }, { data: userReactionData }] = await Promise.all([
                supabase
                    .from("reactions")
                    .select("type")
                    .eq("confession_id", confession.id),
                uid
                    ? supabase
                        .from("reactions")
                        .select("type")
                        .eq("confession_id", confession.id)
                        .eq("user_id", uid)
                    : Promise.resolve({ data: [] })
            ])

            const counts: Record<string, number> = {}
            reactionData?.forEach((r) => {
                counts[r.type] = (counts[r.type] ?? 0) + 1
            })
            setReactions(counts)
            setUserReactions(userReactionData?.map((r) => r.type) ?? [])
        }

        init()
    }, [confession.id])

    const handleReact = async (type: string) => {
        if (!userId || reacting) return
        setReacting(true)

        if (userReactions.includes(type)) {
            // Bỏ react
            await supabase
                .from("reactions")
                .delete()
                .eq("confession_id", confession.id)
                .eq("user_id", userId)
                .eq("type", type)

            setReactions((prev) => ({ ...prev, [type]: Math.max(0, (prev[type] ?? 1) - 1) }))
            setUserReactions((prev) => prev.filter((r) => r !== type))
        } else {
            // Thêm react
            await supabase.from("reactions").insert({
                confession_id: confession.id,
                user_id: userId,
                type
            })

            setReactions((prev) => ({ ...prev, [type]: (prev[type] ?? 0) + 1 }))
            setUserReactions((prev) => [...prev, type])
        }

        setReacting(false)
    }

    const handleComment = async () => {
        if (!userId || !commentText.trim() || submitting) return
        setSubmitting(true)

        const { data, error } = await supabase
            .from("comments")
            .insert({
                confession_id: confession.id,
                user_id: userId,
                content: commentText.trim(),
                is_anonymous: isAnonymous
            })
            .select("id, content, is_anonymous, created_at, user_id")
            .single()

        if (!error && data) {
            setComments((prev) => [...prev, data])
            setCommentText("")
        }

        setSubmitting(false)
    }

    return (
        <div style={styles.wrapper}>
            {/* Confession */}
            <div style={styles.card}>
                {/* Meta */}
                <div style={styles.meta}>
                    <div style={styles.metaLeft}>
                        {confession.field && <span style={styles.badge}>{confession.field}</span>}
                        {confession.position && <span style={styles.badgeGhost}>{confession.position}</span>}
                        {confession.level && <span style={styles.levelBadge}>Mức {confession.level}/5</span>}
                    </div>
                    <span style={styles.date}>{formatDate(confession.created_at)}</span>
                </div>

                {/* Content */}
                <p style={styles.content}>{confession.content}</p>

                <ImageGrid urls={confession.image_urls ?? []} />

                {/* Author */}
                <p style={styles.author}>
                    {confession.is_anonymous ? "🎭 Ẩn danh" : "🌐 Công khai"}
                </p>

                {/* Reactions */}
                <div style={styles.reactions}>
                    {REACTIONS.map((r) => (
                        <button
                            key={r.type}
                            style={{
                                ...styles.reactionBtn,
                                ...(userReactions.includes(r.type) ? styles.reactionBtnActive : {})
                            }}
                            onClick={() => handleReact(r.type)}
                            title={!userId ? "Đăng nhập để react" : r.label}
                            disabled={!userId || reacting}
                        >
                            <span>{r.emoji}</span>
                            <span style={styles.reactionCount}>{reactions[r.type] ?? 0}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Comments */}
            <div style={styles.commentsSection}>
                <p style={styles.sectionLabel}>
                    Bình luận ({comments.length})
                </p>

                {/* Comment input */}
                {userId ? (
                    <div style={styles.commentForm}>
            <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value.slice(0, 300))}
                placeholder="Chia sẻ suy nghĩ của bạn..."
                style={styles.textarea}
            />
                        <div style={styles.commentActions}>
                            <label style={styles.anonLabel}>
                                <input
                                    type="checkbox"
                                    checked={isAnonymous}
                                    onChange={(e) => setIsAnonymous(e.target.checked)}
                                    style={{ accentColor: "#D84040" }}
                                />
                                <span>Ẩn danh</span>
                            </label>
                            <button
                                style={{
                                    ...styles.submitBtn,
                                    ...(!commentText.trim() || submitting ? styles.btnDisabled : {})
                                }}
                                onClick={handleComment}
                                disabled={!commentText.trim() || submitting}
                            >
                                {submitting ? "Đang gửi..." : "Gửi"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p style={styles.loginNote}>Đăng nhập để bình luận.</p>
                )}

                {/* Comment list */}
                <div style={styles.commentList}>
                    {comments.length === 0 && (
                        <p style={styles.emptyText}>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                    )}
                    {comments.map((c) => (
                        <div key={c.id} style={styles.commentCard}>
                            <div style={styles.commentMeta}>
                <span style={styles.commentAuthor}>
                  {c.is_anonymous ? "🎭 Ẩn danh" : "🌐 Người dùng"}
                </span>
                                <span style={styles.commentDate}>{formatDate(c.created_at)}</span>
                            </div>
                            <p style={styles.commentContent}>{c.content}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric"
    })
}

const styles: Record<string, React.CSSProperties> = {
    wrapper: {
        maxWidth: "720px",
        margin: "0 auto",
        padding: "24px 24px 64px",
        display: "flex",
        flexDirection: "column",
        gap: "24px"
    },
    card: {
        background: "rgba(238,238,238,0.03)",
        border: "1px solid rgba(142,22,22,0.25)",
        borderRadius: "14px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "14px"
    },
    meta: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap" as const,
        gap: "6px"
    },
    metaLeft: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        flexWrap: "wrap" as const
    },
    badge: {
        padding: "3px 8px",
        background: "rgba(216,64,64,0.12)",
        border: "1px solid rgba(216,64,64,0.3)",
        borderRadius: "20px",
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "600",
        fontSize: "10px",
        color: "#D84040"
    },
    badgeGhost: {
        padding: "3px 8px",
        border: "1px solid rgba(238,238,238,0.12)",
        borderRadius: "20px",
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "600",
        fontSize: "10px",
        color: "rgba(238,238,238,0.35)"
    },
    levelBadge: {
        padding: "3px 8px",
        background: "rgba(238,238,238,0.04)",
        borderRadius: "20px",
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "700",
        fontSize: "10px",
        color: "rgba(238,238,238,0.25)"
    },
    date: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "500",
        fontSize: "10px",
        color: "rgba(238,238,238,0.2)"
    },
    content: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "500",
        fontSize: "14px",
        color: "rgba(238,238,238,0.8)",
        lineHeight: "1.8",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word"
    },
    imageGrid: {
        display: "flex",
        flexWrap: "wrap" as const,
        gap: "8px"
    },
    image: {
        width: "120px",
        height: "120px",
        objectFit: "cover" as const,
        borderRadius: "8px",
        border: "1px solid rgba(142,22,22,0.25)",
        cursor: "pointer"
    },
    author: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "600",
        fontSize: "10px",
        color: "rgba(238,238,238,0.2)"
    },
    reactions: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap" as const,
        paddingTop: "8px",
        borderTop: "1px solid rgba(142,22,22,0.15)"
    },
    reactionBtn: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "7px 14px",
        background: "rgba(238,238,238,0.04)",
        border: "1px solid rgba(142,22,22,0.2)",
        borderRadius: "20px",
        cursor: "pointer",
        fontFamily: "'Montserrat', sans-serif",
        fontSize: "13px",
        transition: "all 0.15s"
    },
    reactionBtnActive: {
        background: "rgba(216,64,64,0.12)",
        border: "1px solid rgba(216,64,64,0.5)"
    },
    reactionCount: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "600",
        fontSize: "11px",
        color: "rgba(238,238,238,0.5)"
    },
    commentsSection: {
        display: "flex",
        flexDirection: "column",
        gap: "14px"
    },
    sectionLabel: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "700",
        fontSize: "11px",
        letterSpacing: "1px",
        textTransform: "uppercase",
        color: "rgba(238,238,238,0.4)"
    },
    commentForm: {
        display: "flex",
        flexDirection: "column",
        gap: "8px"
    },
    textarea: {
        width: "100%",
        minHeight: "90px",
        background: "rgba(238,238,238,0.04)",
        border: "1px solid rgba(142,22,22,0.4)",
        borderRadius: "10px",
        color: "#EEEEEE",
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "500",
        fontSize: "13px",
        lineHeight: "1.6",
        padding: "12px 14px",
        resize: "none",
        outline: "none",
        caretColor: "#D84040"
    },
    commentActions: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
    },
    anonLabel: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "600",
        fontSize: "11px",
        color: "rgba(238,238,238,0.4)",
        cursor: "pointer"
    },
    submitBtn: {
        padding: "8px 20px",
        background: "linear-gradient(135deg, #D84040 0%, #8E1616 100%)",
        border: "none",
        borderRadius: "8px",
        color: "#EEEEEE",
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "700",
        fontSize: "12px",
        cursor: "pointer",
        letterSpacing: "0.5px"
    },
    btnDisabled: {
        opacity: 0.35,
        cursor: "not-allowed"
    },
    loginNote: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "500",
        fontSize: "12px",
        color: "rgba(238,238,238,0.25)",
        padding: "12px",
        background: "rgba(238,238,238,0.02)",
        border: "1px solid rgba(142,22,22,0.15)",
        borderRadius: "8px"
    },
    commentList: {
        display: "flex",
        flexDirection: "column",
        gap: "10px"
    },
    commentCard: {
        padding: "12px 14px",
        background: "rgba(238,238,238,0.03)",
        border: "1px solid rgba(142,22,22,0.15)",
        borderRadius: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "6px"
    },
    commentMeta: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
    },
    commentAuthor: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "600",
        fontSize: "10px",
        color: "rgba(238,238,238,0.3)"
    },
    commentDate: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "500",
        fontSize: "10px",
        color: "rgba(238,238,238,0.2)"
    },
    commentContent: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "500",
        fontSize: "13px",
        color: "rgba(238,238,238,0.65)",
        lineHeight: "1.6",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word"
    },
    emptyText: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "500",
        fontSize: "12px",
        color: "rgba(238,238,238,0.2)",
        textAlign: "center",
        padding: "20px 0"
    }
}