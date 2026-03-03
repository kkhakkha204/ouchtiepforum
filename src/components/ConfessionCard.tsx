"use client"
import Link from "next/link"
import React, { useState, useEffect } from "react"
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
    user_id: string | null
}

interface Profile {
    display_name: string
    anonymous_name: string
}

const REACTIONS = [
    { type: "like",    emoji: "❤️", label: "Cảm thông" },
    { type: "empathy", emoji: "🤝", label: "Đồng cảm" },
    { type: "brave",   emoji: "💪", label: "Dũng cảm" },
    { type: "relate",  emoji: "😔", label: "Tôi cũng vậy" }
]

export default function ConfessionCard({
                                           confession,
                                           userId
                                       }: {
    confession: Confession
    userId: string | null
}) {
    const [reactions, setReactions] = useState<Record<string, number>>({})
    const [userReaction, setUserReaction] = useState<string | null>(null)
    const [commentCount, setCommentCount] = useState(0)
    const [authorProfile, setAuthorProfile] = useState<Profile | null>(null)
    const [reacting, setReacting] = useState(false)
    const [showPicker, setShowPicker] = useState(false)

    useEffect(() => {
        const load = async () => {
            const { data: reactionData } = await supabase
                .from("reactions")
                .select("type, user_id")
                .eq("confession_id", confession.id)

            const counts: Record<string, number> = {}
            let myR: string | null = null
            reactionData?.forEach(r => {
                counts[r.type] = (counts[r.type] ?? 0) + 1
                if (r.user_id === userId) myR = r.type
            })
            setReactions(counts)
            setUserReaction(myR)

            const { count } = await supabase
                .from("comments")
                .select("id", { count: "exact", head: true })
                .eq("confession_id", confession.id)
            setCommentCount(count ?? 0)

            if (confession.user_id) {
                const { data: prof } = await supabase
                    .from("profiles")
                    .select("display_name, anonymous_name")
                    .eq("id", confession.user_id)
                    .single()
                setAuthorProfile(prof)
            }
        }
        load()
    }, [confession.id, confession.user_id, userId])

    const handleReact = async (type: string) => {
        if (!userId || reacting) return
        setReacting(true)

        if (userReaction === type) {
            await supabase.from("reactions").delete()
                .eq("confession_id", confession.id)
                .eq("user_id", userId)
                .eq("type", type)
            setReactions(prev => ({ ...prev, [type]: Math.max(0, (prev[type] ?? 1) - 1) }))
            setUserReaction(null)
        } else {
            if (userReaction) {
                await supabase.from("reactions").delete()
                    .eq("confession_id", confession.id)
                    .eq("user_id", userId)
                    .eq("type", userReaction)
                setReactions(prev => ({ ...prev, [userReaction]: Math.max(0, (prev[userReaction] ?? 1) - 1) }))
            }
            await supabase.from("reactions").insert({
                confession_id: confession.id,
                user_id: userId,
                type
            })
            setReactions(prev => ({ ...prev, [type]: (prev[type] ?? 0) + 1 }))
            setUserReaction(type)
        }
        setReacting(false)
    }

    const authorName = !authorProfile
        ? (confession.is_anonymous ? "Ẩn danh" : "Công khai")
        : (confession.is_anonymous ? authorProfile.anonymous_name : authorProfile.display_name)

    const authorHref = !confession.is_anonymous && confession.user_id
        ? `/profile/${confession.user_id}`
        : null

    const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0)
    const myEmoji = REACTIONS.find(r => r.type === userReaction)?.emoji

    return (
        <div style={styles.card}>
            {/* Author — nằm trên content */}
            <div style={styles.authorRow}>
                <div style={styles.authorLeft}>
                    {authorHref ? (
                        <Link href={authorHref} style={styles.authorLink}>
                            <div style={styles.authorAvatar}>
                                {authorName[0]?.toUpperCase()}
                            </div>
                            <span style={styles.authorName}>{authorName}</span>
                        </Link>
                    ) : (
                        <div style={styles.authorLink}>
                            <div style={{ ...styles.authorAvatar, ...styles.authorAvatarAnon }}>
                                🎭
                            </div>
                            <span style={styles.authorName}>{authorName}</span>
                        </div>
                    )}
                </div>
                <span style={styles.date}>{formatDate(confession.created_at)}</span>
            </div>

            {/* Badges */}
            <div style={styles.metaLeft}>
                {confession.field && <span style={styles.badge}>{confession.field}</span>}
                {confession.position && <span style={styles.badgeGhost}>{confession.position}</span>}
                {confession.level && <span style={styles.levelBadge}>Mức {confession.level}/5</span>}
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

            {/* Reactions */}
            <div style={styles.reactions}>
                <div style={{ position: "relative" }}>
                    <button
                        style={{
                            ...styles.reactMainBtn,
                            ...(userReaction ? styles.reactMainBtnActive : {})
                        }}
                        onClick={() => setShowPicker(v => !v)}
                        disabled={!userId}
                        title={!userId ? "Đăng nhập để react" : "React"}
                    >
                        {myEmoji ?? "🤍"}
                        {totalReactions > 0 && (
                            <span style={styles.reactionCount}>{totalReactions}</span>
                        )}
                    </button>
                    {showPicker && (
                        <div style={styles.picker}>
                            {REACTIONS.map(r => (
                                <button
                                    key={r.type}
                                    style={{
                                        ...styles.pickerBtn,
                                        ...(userReaction === r.type ? styles.pickerBtnActive : {})
                                    }}
                                    onClick={() => { handleReact(r.type); setShowPicker(false) }}
                                    title={r.label}
                                >
                                    {r.emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <Link href={`/confession/${confession.id}`} style={styles.commentLink}>
                    💬 {commentCount > 0 ? commentCount : ""} Bình luận
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
        background: "rgba(238,238,238,0.04)",
        border: "1px solid rgba(142,22,22,0.25)",
        borderRadius: "14px",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        animation: "fadeIn 0.3s ease"
    },
    // Author row
    authorRow: {
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: "8px"
    },
    authorLeft: { display: "flex", alignItems: "center" },
    authorLink: {
        display: "flex", alignItems: "center", gap: "8px",
        textDecoration: "none", cursor: "pointer"
    },
    authorAvatar: {
        width: "28px", height: "28px", borderRadius: "50%",
        background: "linear-gradient(135deg, #D84040, #8E1616)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "800",
        fontSize: "12px", color: "#EEEEEE", flexShrink: 0
    },
    authorAvatarAnon: {
        background: "rgba(238,238,238,0.08)", fontSize: "13px"
    },
    authorName: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "700",
        fontSize: "12px", color: "rgba(238,238,238,0.75)"
    },
    date: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "500",
        fontSize: "10px", color: "rgba(238,238,238,0.3)", flexShrink: 0
    },
    // Badges
    metaLeft: { display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" },
    badge: {
        padding: "3px 8px", background: "rgba(216,64,64,0.12)",
        border: "1px solid rgba(216,64,64,0.3)", borderRadius: "20px",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "10px", color: "#D84040", letterSpacing: "0.3px"
    },
    badgeGhost: {
        padding: "3px 8px", background: "transparent",
        border: "1px solid rgba(238,238,238,0.15)", borderRadius: "20px",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "10px", color: "rgba(238,238,238,0.45)", letterSpacing: "0.3px"
    },
    levelBadge: {
        padding: "3px 8px", background: "rgba(238,238,238,0.06)",
        borderRadius: "20px", fontFamily: "'Montserrat', sans-serif",
        fontWeight: "700", fontSize: "10px", color: "rgba(238,238,238,0.35)"
    },
    // Content
    contentLink: { textDecoration: "none" },
    content: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "500",
        fontSize: "14px", color: "rgba(238,238,238,0.88)",
        lineHeight: "1.75", whiteSpace: "pre-wrap",
        wordBreak: "break-word", cursor: "pointer"
    },
    // Reactions
    reactions: {
        display: "flex", alignItems: "center", gap: "6px",
        flexWrap: "wrap", paddingTop: "4px",
        borderTop: "1px solid rgba(142,22,22,0.15)"
    },
    reactMainBtn: {
        display: "flex", alignItems: "center", gap: "6px",
        padding: "6px 12px", background: "rgba(238,238,238,0.04)",
        border: "1px solid rgba(142,22,22,0.2)", borderRadius: "20px",
        cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
        fontSize: "13px", color: "#EEEEEE"
    },
    reactMainBtnActive: {
        background: "rgba(216,64,64,0.15)",
        border: "1px solid rgba(216,64,64,0.5)"
    },
    picker: {
        position: "absolute", bottom: "calc(100% + 6px)", left: 0,
        display: "flex", gap: "4px",
        background: "#241A1A", border: "1px solid rgba(142,22,22,0.35)",
        borderRadius: "12px", padding: "6px 8px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)", zIndex: 10,
        whiteSpace: "nowrap"
    },
    pickerBtn: {
        background: "none", border: "none", cursor: "pointer",
        fontSize: "18px", padding: "4px 6px", borderRadius: "8px"
    },
    pickerBtnActive: { background: "rgba(216,64,64,0.2)" },
    reactionCount: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "10px", color: "rgba(238,238,238,0.55)"
    },
    commentLink: {
        marginLeft: "auto", fontFamily: "'Montserrat', sans-serif",
        fontWeight: "600", fontSize: "11px",
        color: "rgba(238,238,238,0.45)", textDecoration: "none",
        letterSpacing: "0.3px"
    }
}