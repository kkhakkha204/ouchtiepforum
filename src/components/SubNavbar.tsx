"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FIELDS } from "@/constants/fields"

export default function SubNavbar() {
    const [query, setQuery] = useState("")
    const [show, setShow] = useState(false)
    const router = useRouter()
    const ref = useRef<HTMLDivElement>(null)

    const filtered = query.trim()
        ? FIELDS.filter((f) => f.toLowerCase().includes(query.toLowerCase()))
        : FIELDS

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setShow(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    const handleSelect = (field: string) => {
        setQuery("")
        setShow(false)
        router.push(`/search?field=${encodeURIComponent(field)}`)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
        setShow(false)
    }

    return (
        <div style={styles.sticky}>
            <div style={styles.inner}>
                <div ref={ref} style={{ position: "relative" }}>
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
                                <button type="button" style={styles.clear} onClick={() => { setQuery(""); setShow(false) }}>
                                    ✕
                                </button>
                            )}
                        </div>

                        {show && (
                            <div style={styles.dropdown}>
                                {filtered.length === 0 ? (
                                    <div style={styles.emptyItem}>Không tìm thấy lĩnh vực</div>
                                ) : (
                                    filtered.map((f) => (
                                        <button
                                            key={f}
                                            type="button"
                                            style={styles.item}
                                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(216,64,64,0.12)")}
                                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                            onClick={() => handleSelect(f)}
                                        >
                                            <span style={styles.fieldDot} />
                                            {f}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
    sticky: {
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(29,22,22,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(142,22,22,0.25)"
    },
    inner: {
        maxWidth: "720px",
        margin: "0 auto",
        padding: "10px 24px"
    },
    icon: {
        width: "16px",
        height: "16px",
        flexShrink: 0
    },
    inputWrap: {
        display: "flex",
        alignItems: "center",
        background: "rgba(238,238,238,0.05)",
        border: "1px solid rgba(142,22,22,0.35)",
        borderRadius: "10px",
        padding: "0 12px",
        gap: "8px"
    },
    input: {
        flex: 1,
        background: "transparent",
        border: "none",
        outline: "none",
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "500",
        fontSize: "13px",
        color: "#EEEEEE",
        padding: "10px 0",
        letterSpacing: "0.2px"
    },
    clear: {
        background: "none",
        border: "none",
        color: "rgba(238,238,238,0.35)",
        cursor: "pointer",
        fontSize: "11px",
        padding: "2px",
        fontFamily: "'Montserrat', sans-serif"
    },
    dropdown: {
        position: "absolute",
        top: "calc(100% + 6px)",
        left: 0,
        right: 0,
        background: "#241A1A",
        border: "1px solid rgba(142,22,22,0.35)",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
    },
    item: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 16px",
        background: "transparent",
        border: "none",
        color: "rgba(238,238,238,0.75)",
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "500",
        fontSize: "13px",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s"
    },
    fieldDot: {
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: "#D84040",
        flexShrink: 0
    },
    emptyItem: {
        padding: "12px 16px",
        color: "rgba(238,238,238,0.25)",
        fontFamily: "'Montserrat', sans-serif",
        fontSize: "12px"
    }
}