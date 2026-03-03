"use client"
import { useState } from "react"

export default function ImageGrid({ urls }: { urls: string[] }) {
    const [lightbox, setLightbox] = useState<string | null>(null)

    if (!urls || urls.length === 0) return null

    const count = urls.length

    return (
        <>
            <div style={getGridStyle(count)}>
                {urls.slice(0, 4).map((url, i) => (
                    <div key={i} style={getItemStyle(i, count)} onClick={() => setLightbox(url)}>
                        <img src={url} alt={`ảnh ${i + 1}`} style={styles.img} />
                        {i === 3 && count > 4 && (
                            <div style={styles.overlay}>
                                <span style={styles.overlayText}>+{count - 4}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

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
        gridTemplateColumns: count === 1 ? "1fr" : "1fr 1fr",
    }
}

function getItemStyle(index: number, count: number): React.CSSProperties {
    const base: React.CSSProperties = {
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        background: "#111",
        aspectRatio: "1 / 1",   // ✅ mặc định vuông
    }

    // 1 ảnh: vuông full width
    if (count === 1) return base

    // 3 ảnh: ảnh đầu full width nhưng vẫn vuông
    if (count === 3 && index === 0) return { ...base, gridColumn: "1 / -1" }

    return base
}

const styles: Record<string, React.CSSProperties> = {
    img: {
        width: "100%", height: "100%",
        objectFit: "cover", display: "block",
        transition: "transform 0.2s ease"
    },
    overlay: {
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center"
    },
    overlayText: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "800", fontSize: "28px", color: "#EEEEEE"
    },
    lightboxBg: {
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, cursor: "zoom-out"
    },
    lightboxImg: {
        maxWidth: "90vw", maxHeight: "90vh",
        objectFit: "contain", borderRadius: "8px"
    }
}