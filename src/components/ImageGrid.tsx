"use client"
import { useState } from "react"

export default function ImageGrid({ urls }: { urls: string[] }) {
    const [lightbox, setLightbox] = useState<string | null>(null)

    if (!urls || urls.length === 0) return null

    const count = urls.length

    return (
        <>
            {/* Grid */}
            <div style={getGridStyle(count)}>
                {urls.slice(0, 4).map((url, i) => (
                    <div
                        key={i}
                        style={getItemStyle(i, count)}
                        onClick={() => setLightbox(url)}
                    >
                        <img src={url} alt={`ảnh ${i + 1}`} style={styles.img} />
                        {/* Overlay "+N" nếu có hơn 4 ảnh */}
                        {i === 3 && count > 4 && (
                            <div style={styles.overlay}>
                                <span style={styles.overlayText}>+{count - 4}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div style={styles.lightboxBg} onClick={() => setLightbox(null)}>
                    <img src={lightbox} alt="preview" style={styles.lightboxImg} />
                </div>
            )}
        </>
    )
}

function getGridStyle(count: number): React.CSSProperties {
    return {
        display: "grid",
        gap: "3px",
        borderRadius: "12px",
        overflow: "hidden",
        gridTemplateColumns: count === 1 ? "1fr" : count === 2 ? "1fr 1fr" : count === 3 ? "1fr 1fr" : "1fr 1fr",
        gridTemplateRows: count === 3 ? "200px 200px" : count >= 4 ? "200px 200px" : "auto"
    }
}

function getItemStyle(index: number, count: number): React.CSSProperties {
    const base: React.CSSProperties = {
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        background: "#111"
    }

    // 1 ảnh: full width, max 400px height
    if (count === 1) return { ...base, height: "640px" }

    // 2 ảnh: 2 cột bằng nhau
    if (count === 2) return { ...base, height: "420px" }

    // 3 ảnh: ảnh đầu chiếm cả hàng trên, 2 ảnh sau chia đôi hàng dưới
    if (count === 3) {
        if (index === 0) return { ...base, gridColumn: "1 / -1", height: "200px" }
        return { ...base, height: "200px" }
    }

    // 4+ ảnh: grid 2x2
    return { ...base, height: "200px" }
}

const styles: Record<string, React.CSSProperties> = {
    img: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        transition: "transform 0.2s ease"
    },
    overlay: {
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    overlayText: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "800",
        fontSize: "28px",
        color: "#EEEEEE"
    },
    lightboxBg: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        cursor: "zoom-out"
    },
    lightboxImg: {
        maxWidth: "90vw",
        maxHeight: "90vh",
        objectFit: "contain",
        borderRadius: "8px"
    }
}