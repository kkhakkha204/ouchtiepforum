"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import ConfessionCard from "./ConfessionCard"

interface Profile {
    id: string
    display_name: string
    anonymous_name: string
    bio: string | null
    website: string | null
    avatar_url: string | null
    cover_url: string | null
}

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

export default function ProfileClient({
                                          profile,
                                          confessions: initialConfessions,
                                          isOwner,
                                          currentUserId
                                      }: {
    profile: Profile
    confessions: Confession[]
    isOwner: boolean
    currentUserId: string | null
}) {
    const router = useRouter()
    const [confessions, setConfessions] = useState(initialConfessions)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [displayName, setDisplayName] = useState(profile.display_name)
    const [bio, setBio] = useState(profile.bio ?? "")
    const [website, setWebsite] = useState(profile.website ?? "")
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
    const [coverUrl, setCoverUrl] = useState(profile.cover_url)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [uploadingCover, setUploadingCover] = useState(false)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
    const [error, setError] = useState("")

    const avatarInputRef = useRef<HTMLInputElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)

    // Upload ảnh lên Supabase Storage
    const uploadImage = async (
        file: File,
        type: "avatar" | "cover"
    ): Promise<string | null> => {
        const ext = file.name.split(".").pop()
        const path = `${profile.id}/${type}-${Date.now()}.${ext}`

        const { error } = await supabase.storage
            .from("avatars")
            .upload(path, file, { upsert: true })

        if (error) return null

        const { data } = supabase.storage.from("avatars").getPublicUrl(path)
        return data.publicUrl
    }

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploadingAvatar(true)
        const url = await uploadImage(file, "avatar")
        if (url) setAvatarUrl(url)
        setUploadingAvatar(false)
    }

    const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploadingCover(true)
        const url = await uploadImage(file, "cover")
        if (url) setCoverUrl(url)
        setUploadingCover(false)
    }

    const handleSave = async () => {
        if (!displayName.trim()) { setError("Display name không được để trống"); return }
        setSaving(true)
        setError("")

        const { error } = await supabase
            .from("profiles")
            .update({
                display_name: displayName.trim(),
                bio: bio || null,
                website: website.trim() || null,
                avatar_url: avatarUrl,
                cover_url: coverUrl
            })
            .eq("id", profile.id)

        if (error) setError("Lưu thất bại, thử lại nhé")
        else { setEditing(false); router.refresh() }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from("confessions").delete().eq("id", id)
        if (error) { console.error("Delete failed:", error.message); return }
        setConfessions(prev => prev.filter(c => c.id !== id))
        setDeleteConfirmId(null)
        router.refresh()
    }

    const totalConfessions = confessions.length

    return (
        <div style={styles.page}>
            {/* Cover */}
            <div style={{ ...styles.cover, backgroundImage: coverUrl ? `url(${coverUrl})` : undefined }}>
                {!coverUrl && <div style={styles.coverPlaceholder} />}
                {isOwner && editing && (
                    <>
                        <button style={styles.changeCoverBtn} onClick={() => coverInputRef.current?.click()}>
                            {uploadingCover ? "Đang tải..." : "Đổi ảnh bìa"}
                        </button>
                        <input ref={coverInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverChange} />
                    </>
                )}
            </div>

            <div style={styles.container}>
                {/* Avatar + actions */}
                <div style={styles.avatarRow}>
                    <div style={styles.avatarWrap}>
                        <div style={styles.avatarRing}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="avatar" style={styles.avatarImg} />
                            ) : (
                                <div style={styles.avatarFallback}>
                                    {profile.display_name[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                        {isOwner && editing && (
                            <>
                                <button style={styles.changeAvatarBtn} onClick={() => avatarInputRef.current?.click()}>
                                    {uploadingAvatar ? "..." : "✏️"}
                                </button>
                                <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
                            </>
                        )}
                    </div>

                    {isOwner && (
                        <div style={styles.actionBtns}>
                            {editing ? (
                                <>
                                    <button style={styles.cancelBtn} onClick={() => { setEditing(false); setError("") }}>Hủy</button>
                                    <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                        {saving ? "Đang lưu..." : "Lưu"}
                                    </button>
                                </>
                            ) : (
                                <button style={styles.editBtn} onClick={() => setEditing(true)}>Chỉnh sửa</button>
                            )}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div style={styles.info}>
                    {editing ? (
                        <div style={styles.editForm}>
                            {error && <p style={styles.errorText}>{error}</p>}
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Tên hiển thị</label>
                                <input
                                    style={styles.input}
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    maxLength={50}
                                    placeholder="Tên hiển thị"
                                />
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Giới thiệu</label>
                                <textarea
                                    style={styles.textarea}
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    maxLength={300}
                                    placeholder="Viết gì đó về bản thân..."
                                    rows={3}
                                />
                                <span style={styles.charCount}>{bio.length}/300</span>
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Website / Social</label>
                                <input
                                    style={styles.input}
                                    value={website}
                                    onChange={e => setWebsite(e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1 style={styles.displayName}>{displayName}</h1>
                            {bio && <p style={styles.bio}>{bio}</p>}         {/* ✅ dùng state bio */}
                            {website && (
                                <a href={website} target="_blank" rel="noopener noreferrer" style={styles.website}>
                                    🔗 {website.replace(/^https?:\/\//, "")}
                                </a>
                            )}
                            <p style={styles.stats}>{totalConfessions} confession{totalConfessions !== 1 ? "s" : ""}</p>
                        </>
                    )}
                </div>

                {/* Feed */}
                <div style={styles.feedSection}>
                    <h2 style={styles.feedTitle}>Confession</h2>

                    {confessions.length === 0 ? (
                        <p style={styles.emptyText}>Chưa có confession nào.</p>
                    ) : (
                        <div style={styles.feed}>
                            {confessions.map(c => (
                                <div key={c.id} style={{ position: "relative" }}>
                                    {isOwner && (
                                        <div style={styles.deleteWrap}>
                                            {deleteConfirmId === c.id ? (
                                                <div style={styles.deleteConfirm}>
                                                    <span style={styles.deleteConfirmText}>Xóa bài này?</span>
                                                    <button style={styles.deleteYes} onClick={() => handleDelete(c.id)}>Xóa</button>
                                                    <button style={styles.deleteNo} onClick={() => setDeleteConfirmId(null)}>Hủy</button>
                                                </div>
                                            ) : (
                                                <button style={styles.deleteBtn} onClick={() => setDeleteConfirmId(c.id)}>
                                                    🗑 Xóa
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <ConfessionCard confession={c} userId={currentUserId} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
    page: { minHeight: "100vh", background: "#1D1616" },

    // Cover
    cover: {
        width: "100%", height: "300px",
        backgroundSize: "cover", backgroundPosition: "center",
        position: "relative", background: "rgba(142,22,22,0.15)"
    },
    coverPlaceholder: {
        width: "100%", height: "100%",
        background: "linear-gradient(135deg, rgba(142,22,22,0.2) 0%, rgba(29,22,22,0.8) 100%)"
    },
    changeCoverBtn: {
        position: "absolute", bottom: "12px", right: "16px",
        padding: "6px 14px", background: "rgba(0,0,0,0.55)",
        border: "1px solid rgba(238,238,238,0.2)", borderRadius: "8px",
        color: "#EEEEEE", fontFamily: "'Montserrat', sans-serif",
        fontWeight: "600", fontSize: "11px", cursor: "pointer"
    },

    container: { maxWidth: "720px", margin: "0 auto", padding: "0 24px 48px" },

    // Avatar row
    avatarRow: {
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-end", marginTop: "-40px", marginBottom: "16px"
    },
    avatarWrap: { position: "relative" },
    avatarRing: {
        width: "88px", height: "88px", borderRadius: "50%",
        padding: "3px",
        background: "linear-gradient(135deg, #D84040, #8E1616)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
    },
    avatarImg: { width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "3px solid #1D1616" },
    avatarFallback: {
        width: "100%", height: "100%", borderRadius: "50%",
        background: "#1D1616", border: "3px solid #1D1616",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "800",
        fontSize: "28px", color: "#EEEEEE"
    },
    changeAvatarBtn: {
        position: "absolute", bottom: "0", right: "0",
        width: "24px", height: "24px", borderRadius: "50%",
        background: "#D84040", border: "2px solid #1D1616",
        cursor: "pointer", fontSize: "11px",
        display: "flex", alignItems: "center", justifyContent: "center"
    },

    // Action buttons
    actionBtns: { display: "flex", gap: "8px", paddingBottom: "8px" },
    editBtn: {
        padding: "8px 20px",
        background: "transparent",
        border: "1px solid rgba(216,64,64,0.5)",
        borderRadius: "8px", color: "#D84040",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "700",
        fontSize: "12px", cursor: "pointer"
    },
    saveBtn: {
        padding: "8px 20px",
        background: "linear-gradient(135deg, #D84040 0%, #8E1616 100%)",
        border: "none", borderRadius: "8px", color: "#EEEEEE",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "700",
        fontSize: "12px", cursor: "pointer"
    },
    cancelBtn: {
        padding: "8px 16px", background: "transparent",
        border: "1px solid rgba(238,238,238,0.12)",
        borderRadius: "8px", color: "rgba(238,238,238,0.4)",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "12px", cursor: "pointer"
    },

    // Info
    info: { marginBottom: "32px" },
    displayName: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "800",
        fontSize: "22px", color: "#EEEEEE", letterSpacing: "-0.5px", marginBottom: "6px"
    },
    bio: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "500",
        fontSize: "13px", color: "rgba(238,238,238,0.55)",
        lineHeight: "1.6", marginBottom: "8px", whiteSpace: "pre-wrap"
    },
    website: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "12px", color: "#D84040", textDecoration: "none",
        display: "block", marginBottom: "10px"
    },
    stats: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "11px", color: "rgba(238,238,238,0.25)"
    },

    // Edit form
    editForm: { display: "flex", flexDirection: "column", gap: "16px" },
    errorText: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "12px", color: "#D84040"
    },
    fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
    label: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "700",
        fontSize: "11px", color: "rgba(238,238,238,0.4)", letterSpacing: "0.5px",
        textTransform: "uppercase"
    },
    input: {
        background: "rgba(238,238,238,0.05)", border: "1px solid rgba(142,22,22,0.35)",
        borderRadius: "10px", padding: "10px 14px",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "500",
        fontSize: "13px", color: "#EEEEEE", outline: "none"
    },
    textarea: {
        background: "rgba(238,238,238,0.05)", border: "1px solid rgba(142,22,22,0.35)",
        borderRadius: "10px", padding: "10px 14px",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "500",
        fontSize: "13px", color: "#EEEEEE", outline: "none",
        resize: "vertical", lineHeight: "1.6"
    },
    charCount: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "500",
        fontSize: "10px", color: "rgba(238,238,238,0.2)",
        textAlign: "right" as const
    },

    // Feed
    feedSection: {},
    feedTitle: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "800",
        fontSize: "14px", color: "rgba(238,238,238,0.8)",
        letterSpacing: "0.5px", textTransform: "uppercase",
        marginBottom: "16px", paddingBottom: "10px",
        borderBottom: "1px solid rgba(142,22,22,0.2)"
    },
    feed: { display: "flex", flexDirection: "column", gap: "16px" },
    emptyText: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "13px", color: "rgba(238,238,238,0.2)",
        textAlign: "center" as const, padding: "32px 0"
    },

    // Delete
    deleteWrap: { display: "flex", justifyContent: "flex-end", marginBottom: "6px" },
    deleteBtn: {
        background: "none", border: "none",
        color: "rgba(238,238,238,0.8)", cursor: "pointer",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "11px", padding: "2px 4px"
    },
    deleteConfirm: { display: "flex", alignItems: "center", gap: "8px" },
    deleteConfirmText: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "11px", color: "rgba(238,238,238,0.4)"
    },
    deleteYes: {
        padding: "4px 12px", background: "#D84040", border: "none",
        borderRadius: "6px", color: "#EEEEEE",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "700",
        fontSize: "11px", cursor: "pointer"
    },
    deleteNo: {
        padding: "4px 10px", background: "transparent",
        border: "1px solid rgba(238,238,238,0.12)",
        borderRadius: "6px", color: "rgba(238,238,238,0.4)",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "11px", cursor: "pointer"
    }
}