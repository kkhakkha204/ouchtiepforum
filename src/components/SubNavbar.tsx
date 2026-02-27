"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FIELDS } from "@/constants/fields"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

export default function SubNavbar() {
    const [query, setQuery] = useState("")
    const [show, setShow] = useState(false)
    const [user, setUser] = useState<User | null>(null)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const router = useRouter()
    const searchRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const filtered = query.trim()
        ? FIELDS.filter((f) => f.toLowerCase().includes(query.toLowerCase()))
        : FIELDS

    // Lấy session
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
        const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
            setUser(session?.user ?? null)
        })
        return () => listener.subscription.unsubscribe()
    }, [])

    // Click ngoài đóng dropdown search
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShow(false)
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    const handleSelect = (field: string) => {
        setQuery(""); setShow(false)
        router.push(`/search?field=${encodeURIComponent(field)}`)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
        setShow(false)
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        setDropdownOpen(false)
        router.refresh()
    }

    const avatarLetter = user
        ? (user.user_metadata?.full_name ?? user.email ?? "?")[0].toUpperCase()
        : null

    return (
        <div style={styles.sticky}>
            <div style={styles.inner}>
                {/* Search */}
                <div ref={searchRef} style={{ position: "relative", flex: 1 }}>
                    <form onSubmit={handleSubmit}>
                        <div style={styles.inputWrap}>
                            <svg style={styles.icon} viewBox="0 0 20 20" fill="none">
                                <circle cx="9" cy="9" r="6" stroke="rgba(238,238,238,0.3)" strokeWidth="1.5"/>
                                <path d="M13.5 13.5L17 17" stroke="rgba(238,238,238,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            <input
                                style={styles.input}
                                placeholder="Tìm kiếm lĩnh vực..."
                                value={query}
                                onChange={(e) => { setQuery(e.target.value); setShow(true) }}
                                onFocus={() => setShow(true)}
                            />
                            {query && (
                                <button type="button" style={styles.clear} onClick={() => { setQuery(""); setShow(false) }}>✕</button>
                            )}
                        </div>

                        {show && (
                            <div style={styles.dropdown}>
                                {filtered.length === 0 ? (
                                    <div style={styles.emptyItem}>Không tìm thấy lĩnh vực</div>
                                ) : (
                                    filtered.map((f) => (
                                        <button
                                            key={f} type="button" style={styles.item}
                                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(216,64,64,0.12)")}
                                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                            onClick={() => handleSelect(f)}>
                                            <span style={styles.fieldDot} />
                                            {f}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </form>
                </div>

                {/* Auth area */}
                {user ? (
                    <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
                        <button style={styles.avatarBtn} onClick={() => setDropdownOpen(v => !v)}>
                            <div style={styles.avatarRing}>
                                <div style={styles.avatar}>{avatarLetter}</div>
                            </div>
                        </button>

                        {dropdownOpen && (
                            <div style={styles.userDropdown}>
                                <div style={styles.userInfo}>
                                    <p style={styles.userName}>{user.user_metadata?.full_name ?? "Chiến binh ẩn danh"}</p>
                                    <p style={styles.userEmail}>{user.email}</p>
                                </div>
                                <div style={styles.dropDivider} />
                                <button
                                    style={styles.signOutBtn}
                                    onMouseEnter={e => (e.currentTarget.style.color = "#D84040")}
                                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(238,238,238,0.45)")}
                                    onClick={handleSignOut}>
                                    ↩ Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link href="/auth" style={styles.loginBtn}>Đăng nhập</Link>
                )}
            </div>
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
    sticky: {
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(29,22,22,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(142,22,22,0.25)"
    },
    inner: {
        maxWidth: "720px", margin: "0 auto",
        padding: "10px 24px",
        display: "flex", alignItems: "center", gap: "12px"
    },
    icon: { width: "16px", height: "16px", flexShrink: 0 },
    inputWrap: {
        display: "flex", alignItems: "center",
        background: "rgba(238,238,238,0.05)",
        border: "1px solid rgba(142,22,22,0.35)",
        borderRadius: "10px", padding: "0 12px", gap: "8px"
    },
    input: {
        flex: 1, background: "transparent", border: "none", outline: "none",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "500",
        fontSize: "13px", color: "#EEEEEE", padding: "10px 0", letterSpacing: "0.2px"
    },
    clear: {
        background: "none", border: "none",
        color: "rgba(238,238,238,0.35)", cursor: "pointer",
        fontSize: "11px", padding: "2px", fontFamily: "'Montserrat', sans-serif"
    },
    dropdown: {
        position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
        background: "#241A1A", border: "1px solid rgba(142,22,22,0.35)",
        borderRadius: "10px", overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
    },
    item: {
        width: "100%", display: "flex", alignItems: "center", gap: "10px",
        padding: "10px 16px", background: "transparent", border: "none",
        color: "rgba(238,238,238,0.75)", fontFamily: "'Montserrat', sans-serif",
        fontWeight: "500", fontSize: "13px", cursor: "pointer",
        textAlign: "left", transition: "background 0.15s"
    },
    fieldDot: { width: "6px", height: "6px", borderRadius: "50%", background: "#D84040", flexShrink: 0 },
    emptyItem: {
        padding: "12px 16px", color: "rgba(238,238,238,0.25)",
        fontFamily: "'Montserrat', sans-serif", fontSize: "12px"
    },
    // Auth
    loginBtn: {
        flexShrink: 0, padding: "8px 18px",
        background: "linear-gradient(135deg, #D84040 0%, #8E1616 100%)",
        border: "none", borderRadius: "8px", color: "#EEEEEE",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "700",
        fontSize: "12px", letterSpacing: "0.5px",
        textDecoration: "none", cursor: "pointer",
        boxShadow: "0 2px 10px rgba(216,64,64,0.3)",
        whiteSpace: "nowrap"
    },
    avatarBtn: { background: "none", border: "none", cursor: "pointer", padding: "0" },
    avatarRing: {
        padding: "2px", borderRadius: "50%",
        background: "linear-gradient(135deg, #D84040, #8E1616)"
    },
    avatar: {
        width: "32px", height: "32px", borderRadius: "50%",
        background: "#1D1616", border: "2px solid #1D1616",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "800",
        fontSize: "14px", color: "#EEEEEE"
    },
    userDropdown: {
        position: "absolute", top: "calc(100% + 8px)", right: 0,
        width: "200px", background: "#241A1A",
        border: "1px solid rgba(142,22,22,0.35)",
        borderRadius: "12px", padding: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        display: "flex", flexDirection: "column", gap: "8px"
    },
    userInfo: { display: "flex", flexDirection: "column", gap: "3px", padding: "2px 4px" },
    userName: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "700",
        fontSize: "13px", color: "#EEEEEE", letterSpacing: "-0.2px"
    },
    userEmail: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "500",
        fontSize: "10px", color: "rgba(238,238,238,0.35)"
    },
    dropDivider: { height: "1px", background: "rgba(142,22,22,0.25)" },
    signOutBtn: {
        background: "none", border: "none",
        color: "rgba(238,238,238,0.45)",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "12px", cursor: "pointer", textAlign: "left",
        padding: "4px", transition: "color 0.15s"
    }
}