"use client"
import Link from "next/link"
import { useState } from "react"
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
    image_urls?: string[]
    reaction_counts?: Record<string, number>
}

const REACTIONS = [
    { type: "like",    emoji: "❤️",  label: "Cảm thông" },
    { type: "empathy", emoji: "🤝",  label: "Đồng cảm" },
    { type: "brave",   emoji: "💪",  label: "Dũng cảm" },
    { type: "relate",  emoji: "😔",  label: "Tôi cũng vậy" }
]

export default function ConfessionCard({
                                           confession,
                                           userId
                                       }: {
    confession: Confession
    userId: string | null
}) {
    const [reactions, setReactions] = useState<Record<string, number>>(
        confession.reaction_counts ?? {}
    )
    const [reacting, setReacting] = useState(false)

    const handleReact = async (type: string) => {
        if (!userId || reacting) return
        setReacting(true)

        const { error } = await supabase.from("reactions").insert({
            confession_id: confession.id,
            user_id: userId,
            type
        })

        if (!error) {
            setReactions((prev) => ({ ...prev, [type]: (prev[type] ?? 0) + 1 }))
        }

        setReacting(false)
    }

    return (
        <div style={styles.card}>
            {/* Meta */}
            <div style={styles.meta}>
                <div style={styles.metaLeft}>
                    {confession.field && (
                        <span style={styles.badge}>{confession.field}</span>
                    )}
                    {confession.position && (
                        <span style={styles.badgeGhost}>{confession.position}</span>
                    )}
                    {confession.level && (
                        <span style={styles.levelBadge}>Mức {confession.level}/5</span>
                    )}
                </div>
                <span style={styles.date}>{formatDate(confession.created_at)}</span>
            </div>

            {/* Content */}
            <Link href={`/confession/${confession.id}`} style={styles.contentLink}>
                <p style={styles.content}>
                    {confession.content.length > 200
                        ? confession.content.slice(0, 200) + "..."
                        : confession.content}
                </p>
            </Link>

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
                        style={styles.reactionBtn}
                        onClick={() => handleReact(r.type)}
                        title={!userId ? "Đăng nhập để react" : r.label}
                        disabled={!userId || reacting}
                    >
                        <span>{r.emoji}</span>
                        <span style={styles.reactionCount}>{reactions[r.type] ?? 0}</span>
                    </button>
                ))}
                <Link href={`/confession/${confession.id}`} style={styles.commentLink}>
                    💬 Bình luận
                </Link>
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
    card: {
        background: "rgba(238,238,238,0.03)",
        border: "1px solid rgba(142,22,22,0.25)",
        borderRadius: "14px",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        animation: "fadeIn 0.3s ease"
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
        color: "#D84040",
        letterSpacing: "0.3px"
    },
    badgeGhost: {
        padding: "3px 8px",
        background: "transparent",
        border: "1px solid rgba(238,238,238,0.12)",
        borderRadius: "20px",
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "600",
        fontSize: "10px",
        color: "rgba(238,238,238,0.35)",
        letterSpacing: "0.3px"
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
    contentLink: { textDecoration: "none" },
    content: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "500",
        fontSize: "13px",
        color: "rgba(238,238,238,0.75)",
        lineHeight: "1.7",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        cursor: "pointer"
    },
    author: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "600",
        fontSize: "10px",
        color: "rgba(238,238,238,0.2)",
        letterSpacing: "0.3px"
    },
    reactions: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        flexWrap: "wrap" as const,
        paddingTop: "4px",
        borderTop: "1px solid rgba(142,22,22,0.15)"
    },
    reactionBtn: {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "5px 10px",
        background: "rgba(238,238,238,0.04)",
        border: "1px solid rgba(142,22,22,0.2)",
        borderRadius: "20px",
        cursor: "pointer",
        fontFamily: "'Montserrat', sans-serif",
        fontSize: "12px"
    },
    reactionCount: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "600",
        fontSize: "10px",
        color: "rgba(238,238,238,0.4)"
    },
    commentLink: {
        marginLeft: "auto",
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "600",
        fontSize: "11px",
        color: "rgba(238,238,238,0.3)",
        textDecoration: "none",
        letterSpacing: "0.3px"
    }
}