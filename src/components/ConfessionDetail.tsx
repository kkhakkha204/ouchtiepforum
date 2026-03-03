"use client"
import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import ImageGrid from "./ImageGrid"
import Link from "next/link"

interface Confession {
    id: string
    content: string
    field: string | null
    position: string | null
    level: number | null
    is_anonymous: boolean
    created_at: string
    image_urls: string[]
    user_id: string | null
}

interface Profile {
    display_name: string
    anonymous_name: string
    avatar_url?: string | null
}

interface Comment {
    id: string
    content: string
    is_anonymous: boolean
    created_at: string
    user_id: string
    parent_id: string | null
    profile?: Profile | null
    like_count?: number
    user_liked?: boolean
}

const REACTIONS = [
    { type: "like",    emoji: "❤️", label: "Cảm thông" },
    { type: "empathy", emoji: "🤝", label: "Đồng cảm" },
    { type: "brave",   emoji: "💪", label: "Dũng cảm" },
    { type: "relate",  emoji: "😔", label: "Tôi cũng vậy" }
]

export default function ConfessionDetail({
                                             confession,
                                             initialComments
                                         }: {
    confession: Confession
    initialComments: Comment[]
}) {
    const [userId, setUserId] = useState<string | null>(null)
    const [authorProfile, setAuthorProfile] = useState<Profile | null>(null)
    const [reactions, setReactions] = useState<Record<string, number>>({})
    const [userReaction, setUserReaction] = useState<string | null>(null)
    const [showPicker, setShowPicker] = useState(false)
    const [comments, setComments] = useState<Comment[]>([])
    const [commentText, setCommentText] = useState("")
    const [myCommentIsAnon, setMyCommentIsAnon] = useState<boolean | null>(null)
    const [pendingIsAnon, setPendingIsAnon] = useState(false)
    const [replyTo, setReplyTo] = useState<string | null>(null)
    const [replyText, setReplyText] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [reacting, setReacting] = useState(false)

    useEffect(() => {
        const init = async () => {
            const { data: authData } = await supabase.auth.getUser()
            const uid = authData.user?.id ?? null
            setUserId(uid)

            if (confession.user_id) {
                const { data: prof } = await supabase
                    .from("profiles")
                    .select("display_name, anonymous_name, avatar_url")
                    .eq("id", confession.user_id)
                    .single()
                setAuthorProfile(prof)
            }

            const { data: reactionData } = await supabase
                .from("reactions")
                .select("type, user_id")
                .eq("confession_id", confession.id)

            const counts: Record<string, number> = {}
            let myR: string | null = null
            reactionData?.forEach((r) => {
                counts[r.type] = (counts[r.type] ?? 0) + 1
                if (r.user_id === uid) myR = r.type
            })
            setReactions(counts)
            setUserReaction(myR)

            const { data: commentData } = await supabase
                .from("comments")
                .select("id, content, is_anonymous, created_at, user_id, parent_id")
                .eq("confession_id", confession.id)
                .order("created_at", { ascending: true })

            if (!commentData) return

            const userIds = [...new Set(commentData.map(c => c.user_id).filter(Boolean))]
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, display_name, anonymous_name, avatar_url")
                .in("id", userIds)

            const profileMap: Record<string, Profile> = {}
            profiles?.forEach(p => { profileMap[p.id] = p })

            // Chỉ lấy like cho comment
            const commentIds = commentData.map(c => c.id)
            const { data: cReactions } = await supabase
                .from("comment_reactions")
                .select("comment_id, type, user_id")
                .in("comment_id", commentIds)
                .eq("type", "like")

            const likeCounts: Record<string, number> = {}
            const userLiked: Record<string, boolean> = {}
            cReactions?.forEach(r => {
                likeCounts[r.comment_id] = (likeCounts[r.comment_id] ?? 0) + 1
                if (r.user_id === uid) userLiked[r.comment_id] = true
            })

            if (uid) {
                const myComment = commentData.find(c => c.user_id === uid)
                if (myComment) setMyCommentIsAnon(myComment.is_anonymous)
            }

            setComments(commentData.map(c => ({
                ...c,
                profile: profileMap[c.user_id] ?? null,
                like_count: likeCounts[c.id] ?? 0,
                user_liked: userLiked[c.id] ?? false
            })))
        }

        init()
    }, [confession.id, confession.user_id])

    const handleReact = async (type: string) => {
        if (!userId || reacting) return
        setReacting(true)
        setShowPicker(false)

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

    const handleLikeComment = async (commentId: string) => {
        if (!userId) return
        const comment = comments.find(c => c.id === commentId)
        if (!comment) return

        if (comment.user_liked) {
            await supabase.from("comment_reactions").delete()
                .eq("comment_id", commentId)
                .eq("user_id", userId)
                .eq("type", "like")
            setComments(prev => prev.map(c => c.id === commentId
                ? { ...c, like_count: Math.max(0, (c.like_count ?? 1) - 1), user_liked: false }
                : c
            ))
        } else {
            await supabase.from("comment_reactions").insert({
                comment_id: commentId,
                user_id: userId,
                type: "like"
            })
            setComments(prev => prev.map(c => c.id === commentId
                ? { ...c, like_count: (c.like_count ?? 0) + 1, user_liked: true }
                : c
            ))
        }
    }

    const getIsAnonymous = (): boolean => {
        if (myCommentIsAnon !== null) return myCommentIsAnon
        if (userId === confession.user_id) return confession.is_anonymous
        return pendingIsAnon
    }

    const handleComment = async (parentId: string | null = null) => {
        const text = parentId ? replyText : commentText
        if (!userId || !text.trim() || submitting) return
        setSubmitting(true)

        const isAnon = myCommentIsAnon !== null
            ? myCommentIsAnon
            : (userId === confession.user_id ? confession.is_anonymous : pendingIsAnon)

        const { data, error } = await supabase
            .from("comments")
            .insert({
                confession_id: confession.id,
                user_id: userId,
                content: text.trim(),
                is_anonymous: isAnon,
                parent_id: parentId
            })
            .select("id, content, is_anonymous, created_at, user_id, parent_id")
            .single()

        if (!error && data) {
            const { data: prof } = await supabase
                .from("profiles")
                .select("display_name, anonymous_name, avatar_url")
                .eq("id", userId)
                .single()

            setComments(prev => [...prev, {
                ...data,
                profile: prof,
                like_count: 0,
                user_liked: false
            }])

            if (myCommentIsAnon === null) setMyCommentIsAnon(isAnon)
            if (parentId) { setReplyText(""); setReplyTo(null) }
            else setCommentText("")
        }

        setSubmitting(false)
    }

    // Author confession
    const authorName = !authorProfile
        ? (confession.is_anonymous ? "Ẩn danh" : "Công khai")
        : (confession.is_anonymous ? authorProfile.anonymous_name : authorProfile.display_name)

    const authorHref = !confession.is_anonymous && confession.user_id
        ? `/profile/${confession.user_id}`
        : null

    // Author comment
    const getCommentAuthorName = (c: Comment) => {
        if (!c.profile) return c.is_anonymous ? "Ẩn danh" : "Người dùng"
        return c.is_anonymous ? c.profile.anonymous_name : c.profile.display_name
    }

    const getCommentAuthorHref = (c: Comment) =>
        !c.is_anonymous && c.user_id ? `/profile/${c.user_id}` : null

    const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0)
    const myEmoji = REACTIONS.find(r => r.type === userReaction)?.emoji

    const showAnonToggle = myCommentIsAnon === null && userId !== confession.user_id

    const buildTree = (comments: Comment[], parentId: string | null = null, depth = 0): React.ReactElement[] => {
        return comments
            .filter(c => c.parent_id === parentId)
            .map(c => {
                const cName = getCommentAuthorName(c)
                const cHref = getCommentAuthorHref(c)
                const avatarLetter = cName[0]?.toUpperCase()

                return (
                    <div key={c.id} style={{ ...styles.commentCard, marginLeft: depth > 0 ? Math.min(depth * 20, 60) : 0 }}>
                        {/* Comment author row */}
                        <div style={styles.commentAuthorRow}>
                            <div style={styles.commentAuthorLeft}>
                                {cHref ? (
                                    <Link href={cHref} style={styles.commentAuthorLink}>
                                        {c.profile?.avatar_url ? (
                                            <img src={c.profile.avatar_url} alt={cName} style={styles.commentAvatar} />
                                        ) : (
                                            <div style={styles.commentAvatarFallback}>{avatarLetter}</div>
                                        )}
                                        <span style={styles.commentAuthorName}>{cName}</span>
                                    </Link>
                                ) : (
                                    <div style={styles.commentAuthorLink}>
                                        <div style={{ ...styles.commentAvatarFallback, ...styles.commentAvatarAnon }}>🎭</div>
                                        <span style={styles.commentAuthorName}>{cName}</span>
                                    </div>
                                )}
                            </div>
                            <span style={styles.commentDate}>{formatDate(c.created_at)}</span>
                        </div>

                        <p style={styles.commentContent}>{c.content}</p>

                        {/* Like + reply */}
                        <div style={styles.cReactions}>
                            <button
                                style={{
                                    ...styles.cLikeBtn,
                                    ...(c.user_liked ? styles.cLikeBtnActive : {})
                                }}
                                onClick={() => handleLikeComment(c.id)}
                                disabled={!userId}
                                title="Thích"
                            >
                                ❤️ {c.like_count ? <span style={styles.cReactionCount}>{c.like_count}</span> : null}
                            </button>
                            {userId && (
                                <button
                                    style={styles.replyBtn}
                                    onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                                >
                                    ↩ Trả lời
                                </button>
                            )}
                        </div>

                        {replyTo === c.id && (
                            <div style={styles.replyForm}>
                                <textarea
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value.slice(0, 300))}
                                    placeholder="Trả lời..."
                                    style={styles.textarea}
                                />
                                <div style={styles.replyActions}>
                                    {myCommentIsAnon === null && userId !== confession.user_id && (
                                        <label style={styles.anonLabel}>
                                            <input
                                                type="checkbox"
                                                checked={pendingIsAnon}
                                                onChange={e => setPendingIsAnon(e.target.checked)}
                                                style={{ accentColor: "#D84040" }}
                                            />
                                            <span>Ẩn danh</span>
                                        </label>
                                    )}
                                    <button style={styles.cancelBtn} onClick={() => setReplyTo(null)}>Huỷ</button>
                                    <button
                                        style={{ ...styles.submitBtn, ...(!replyText.trim() || submitting ? styles.btnDisabled : {}) }}
                                        onClick={() => handleComment(c.id)}
                                        disabled={!replyText.trim() || submitting}
                                    >
                                        {submitting ? "Đang gửi..." : "Gửi"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {buildTree(comments, c.id, depth + 1)}
                    </div>
                )
            })
    }

    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>
                {/* Author — trên content */}
                <div style={styles.authorRow}>
                    <div style={styles.authorLeft}>
                        {authorHref ? (
                            <Link href={authorHref} style={styles.authorLink}>
                                {authorProfile?.avatar_url ? (
                                    <img src={authorProfile.avatar_url} alt={authorName} style={styles.authorAvatarImg} />
                                ) : (
                                    <div style={styles.authorAvatar}>{authorName[0]?.toUpperCase()}</div>
                                )}
                                <span style={styles.authorName}>{authorName}</span>
                            </Link>
                        ) : (
                            <div style={styles.authorLink}>
                                <div style={{ ...styles.authorAvatar, ...styles.authorAvatarAnon }}>🎭</div>
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

                <p style={styles.content}>{confession.content}</p>
                <ImageGrid urls={confession.image_urls ?? []} />

                {/* Reactions — popover */}
                <div style={styles.reactions}>
                    <div style={{ position: "relative" }}>
                        <button
                            style={{ ...styles.reactionBtn, ...(userReaction ? styles.reactionBtnActive : {}) }}
                            onClick={() => userId && setShowPicker(v => !v)}
                            disabled={!userId || reacting}
                            title={!userId ? "Đăng nhập để react" : "React"}
                        >
                            {myEmoji ?? "🤍"}{totalReactions > 0 && <span style={styles.reactionCount}>{totalReactions}</span>}
                        </button>
                        {showPicker && (
                            <div style={styles.picker}>
                                {REACTIONS.map(r => (
                                    <button
                                        key={r.type}
                                        style={{ ...styles.pickerBtn, ...(userReaction === r.type ? styles.pickerBtnActive : {}) }}
                                        onClick={() => handleReact(r.type)}
                                        title={r.label}
                                    >
                                        {r.emoji}
                                        {(reactions[r.type] ?? 0) > 0 && (
                                            <span style={styles.pickerCount}>{reactions[r.type]}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Comments */}
            <div style={styles.commentsSection}>
                <p style={styles.sectionLabel}>Bình luận ({comments.length})</p>

                {userId ? (
                    <div style={styles.commentForm}>
                        <p style={styles.commentingAs}>
                            Bình luận với tư cách: <strong>
                            {myCommentIsAnon !== null
                                ? (myCommentIsAnon ? "🎭 Ẩn danh" : "🌐 Công khai")
                                : (showAnonToggle
                                    ? (pendingIsAnon ? "🎭 Ẩn danh" : "🌐 Công khai")
                                    : (confession.is_anonymous ? "🎭 Ẩn danh" : "🌐 Công khai"))}
                        </strong>
                        </p>
                        <textarea
                            value={commentText}
                            onChange={e => setCommentText(e.target.value.slice(0, 300))}
                            placeholder="Chia sẻ suy nghĩ của bạn..."
                            style={styles.textarea}
                        />
                        <div style={styles.commentActions}>
                            {showAnonToggle && (
                                <label style={styles.anonLabel}>
                                    <input
                                        type="checkbox"
                                        checked={pendingIsAnon}
                                        onChange={e => setPendingIsAnon(e.target.checked)}
                                        style={{ accentColor: "#D84040" }}
                                    />
                                    <span>Ẩn danh</span>
                                </label>
                            )}
                            {!showAnonToggle && myCommentIsAnon === null && userId === confession.user_id && (
                                <span style={styles.fixedAnonNote}>
                                    {confession.is_anonymous ? "🎭 Bạn sẽ comment ẩn danh" : "🌐 Bạn sẽ comment công khai"}
                                </span>
                            )}
                            <button
                                style={{ ...styles.submitBtn, ...(!commentText.trim() || submitting ? styles.btnDisabled : {}) }}
                                onClick={() => handleComment(null)}
                                disabled={!commentText.trim() || submitting}
                            >
                                {submitting ? "Đang gửi..." : "Gửi"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <Link href="/auth" style={styles.loginNote}>Đăng nhập để bình luận →</Link>
                )}

                <div style={styles.commentList}>
                    {comments.length === 0 && (
                        <p style={styles.emptyText}>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                    )}
                    {buildTree(comments)}
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
        maxWidth: "720px", margin: "0 auto",
        padding: "24px 24px 64px",
        display: "flex", flexDirection: "column", gap: "20px"
    },
    card: {
        background: "rgba(238,238,238,0.04)",
        border: "1px solid rgba(142,22,22,0.25)",
        borderRadius: "14px", padding: "20px",
        display: "flex", flexDirection: "column", gap: "12px"
    },
    // Author
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
        width: "32px", height: "32px", borderRadius: "50%",
        background: "linear-gradient(135deg, #D84040, #8E1616)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "800",
        fontSize: "13px", color: "#EEEEEE", flexShrink: 0
    },
    authorAvatarAnon: { background: "rgba(238,238,238,0.08)", fontSize: "14px" },
    authorAvatarImg: {
        width: "32px", height: "32px", borderRadius: "50%",
        objectFit: "cover", flexShrink: 0
    },
    authorName: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "700",
        fontSize: "13px", color: "rgba(238,238,238,0.85)"
    },
    date: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "500",
        fontSize: "10px", color: "rgba(238,238,238,0.35)", flexShrink: 0
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
        fontSize: "10px", color: "rgba(238,238,238,0.5)", letterSpacing: "0.3px"
    },
    levelBadge: {
        padding: "3px 8px", background: "rgba(238,238,238,0.06)",
        borderRadius: "20px", fontFamily: "'Montserrat', sans-serif",
        fontWeight: "700", fontSize: "10px", color: "rgba(238,238,238,0.4)"
    },
    content: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "500",
        fontSize: "15px", color: "rgba(238,238,238,0.9)",
        lineHeight: "1.8", whiteSpace: "pre-wrap", wordBreak: "break-word"
    },
    // Reactions
    reactions: {
        display: "flex", alignItems: "center", gap: "6px",
        paddingTop: "8px", borderTop: "1px solid rgba(142,22,22,0.15)"
    },
    reactionBtn: {
        display: "flex", alignItems: "center", gap: "6px",
        padding: "6px 14px", background: "rgba(238,238,238,0.04)",
        border: "1px solid rgba(142,22,22,0.2)", borderRadius: "20px",
        cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
        fontSize: "14px", color: "#EEEEEE"
    },
    reactionBtnActive: {
        background: "rgba(216,64,64,0.15)",
        border: "1px solid rgba(216,64,64,0.5)"
    },
    reactionCount: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "700",
        fontSize: "12px", color: "rgba(238,238,238,0.7)"
    },
    picker: {
        position: "absolute", bottom: "calc(100% + 6px)", left: 0,
        display: "flex", gap: "4px",
        background: "#241A1A", border: "1px solid rgba(142,22,22,0.35)",
        borderRadius: "12px", padding: "6px 8px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)", zIndex: 10,
        whiteSpace: "nowrap"
    },
    pickerCount: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "700",
        fontSize: "10px", color: "rgba(238,238,238,0.6)",
        marginLeft: "2px"
    },
    pickerBtn: {
        background: "none", border: "none", cursor: "pointer",
        fontSize: "18px", padding: "4px 8px", borderRadius: "8px",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: "2px", minWidth: "36px"
    },
    pickerBtnActive: { background: "rgba(216,64,64,0.2)" },
    // Comments
    commentsSection: { display: "flex", flexDirection: "column", gap: "16px" },
    sectionLabel: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "700",
        fontSize: "13px", color: "rgba(238,238,238,0.55)",
        letterSpacing: "0.5px", textTransform: "uppercase"
    },
    commentForm: {
        background: "rgba(238,238,238,0.02)",
        border: "1px solid rgba(142,22,22,0.2)",
        borderRadius: "12px", padding: "14px",
        display: "flex", flexDirection: "column", gap: "10px"
    },
    commentingAs: {
        fontFamily: "'Montserrat', sans-serif", fontSize: "11px",
        color: "rgba(238,238,238,0.4)", fontWeight: "500"
    },
    textarea: {
        width: "100%", minHeight: "80px",
        background: "rgba(238,238,238,0.04)",
        border: "1px solid rgba(142,22,22,0.3)",
        borderRadius: "8px", color: "#EEEEEE",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "500",
        fontSize: "13px", padding: "10px 12px",
        outline: "none", resize: "vertical", caretColor: "#D84040"
    },
    commentActions: {
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: "8px"
    },
    anonLabel: {
        display: "flex", alignItems: "center", gap: "6px",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "11px", color: "rgba(238,238,238,0.4)", cursor: "pointer"
    },
    fixedAnonNote: {
        fontFamily: "'Montserrat', sans-serif", fontSize: "11px",
        color: "rgba(238,238,238,0.3)", fontWeight: "500"
    },
    submitBtn: {
        padding: "8px 20px",
        background: "linear-gradient(135deg, #D84040 0%, #8E1616 100%)",
        border: "none", borderRadius: "8px", color: "#EEEEEE",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "700",
        fontSize: "12px", cursor: "pointer", marginLeft: "auto"
    },
    btnDisabled: { opacity: 0.4, cursor: "not-allowed" },
    loginNote: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "12px", color: "rgba(216,64,64,0.7)", textDecoration: "none"
    },
    commentList: { display: "flex", flexDirection: "column", gap: "10px" },
    commentCard: {
        background: "rgba(238,238,238,0.02)",
        border: "1px solid rgba(142,22,22,0.15)",
        borderRadius: "10px", padding: "12px 14px",
        display: "flex", flexDirection: "column", gap: "8px"
    },
    // Comment author
    commentAuthorRow: {
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: "8px"
    },
    commentAuthorLeft: { display: "flex", alignItems: "center" },
    commentAuthorLink: {
        display: "flex", alignItems: "center", gap: "8px",
        textDecoration: "none", cursor: "pointer"
    },
    commentAvatar: {
        width: "24px", height: "24px", borderRadius: "50%",
        objectFit: "cover", flexShrink: 0
    },
    commentAvatarFallback: {
        width: "24px", height: "24px", borderRadius: "50%",
        background: "linear-gradient(135deg, #D84040, #8E1616)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "800",
        fontSize: "10px", color: "#EEEEEE", flexShrink: 0
    },
    commentAvatarAnon: { background: "rgba(238,238,238,0.08)", fontSize: "11px" },
    commentAuthorName: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "700",
        fontSize: "12px", color: "rgba(238,238,238,0.75)"
    },
    commentDate: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "500",
        fontSize: "10px", color: "rgba(238,238,238,0.25)", flexShrink: 0
    },
    commentContent: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "500",
        fontSize: "13px", color: "rgba(238,238,238,0.8)",
        lineHeight: "1.6", whiteSpace: "pre-wrap", wordBreak: "break-word"
    },
    // Comment like
    cReactions: { display: "flex", alignItems: "center", gap: "6px" },
    cLikeBtn: {
        display: "flex", alignItems: "center", gap: "4px",
        padding: "3px 10px", background: "rgba(238,238,238,0.03)",
        border: "1px solid rgba(142,22,22,0.15)", borderRadius: "20px",
        cursor: "pointer", fontSize: "12px", color: "#EEEEEE",
        fontFamily: "'Montserrat', sans-serif"
    },
    cLikeBtnActive: {
        background: "rgba(216,64,64,0.12)",
        border: "1px solid rgba(216,64,64,0.4)"
    },
    cReactionCount: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "10px", color: "rgba(238,238,238,0.5)"
    },
    replyBtn: {
        background: "none", border: "none",
        color: "rgba(238,238,238,0.35)",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "11px", cursor: "pointer", padding: "3px 6px"
    },
    replyForm: { display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" },
    replyActions: { display: "flex", gap: "8px", justifyContent: "flex-end" },
    cancelBtn: {
        padding: "6px 14px", background: "transparent",
        border: "1px solid rgba(142,22,22,0.3)",
        borderRadius: "8px", color: "rgba(238,238,238,0.4)",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "11px", cursor: "pointer"
    },
    emptyText: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "500",
        fontSize: "12px", color: "rgba(238,238,238,0.25)",
        textAlign: "center", padding: "24px 0"
    }
}