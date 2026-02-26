"use client"
import Link from "next/link"

export default function Navbar() {
    return (
        <header style={styles.header}>
            <div style={styles.inner}>
                <Link href="/" style={styles.logo}>Ouch!</Link>
                <p style={styles.tagline}>Nơi thất bại được lắng nghe</p>
            </div>
        </header>
    )
}

const styles: Record<string, React.CSSProperties> = {
    header: {
        background: "linear-gradient(135deg, #D84040 0%, #8E1616 50%, #1D1616 100%)",
        borderBottom: "1px solid rgba(142,22,22,0.4)"
    },
    inner: {
        maxWidth: "720px",
        margin: "0 auto",
        padding: "28px 24px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "4px"
    },
    logo: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "900",
        fontSize: "42px",
        color: "#EEEEEE",
        letterSpacing: "-2px",
        textDecoration: "none",
        textShadow: "0 2px 24px rgba(0,0,0,0.4)"
    },
    tagline: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "500",
        fontSize: "12px",
        color: "rgba(238,238,238,0.45)",
        letterSpacing: "0.3px"
    }
}