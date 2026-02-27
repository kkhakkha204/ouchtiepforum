"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

type Mode = "login" | "register"

export default function AuthPage() {
    const router = useRouter()
    const [mode, setMode] = useState<Mode>("login")
    const [displayName, setDisplayName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        setError(null)
        setSuccessMsg(null)
        if (!email.trim() || !password.trim()) return setError("Vui lòng điền đầy đủ thông tin.")
        if (password.length < 6) return setError("Mật khẩu tối thiểu 6 ký tự.")
        if (mode === "register" && !displayName.trim()) return setError("Vui lòng nhập tên hiển thị.")

        setSubmitting(true)

        if (mode === "login") {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) { setError(mapError(error.message)); setSubmitting(false); return }
            router.push("/")
            router.refresh()
        } else {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: displayName.trim() } }
            })
            if (error) setError(mapError(error.message))
            else setSuccessMsg("Đăng ký thành công! Kiểm tra email để xác nhận.")
        }

        setSubmitting(false)
    }

    return (
        <div style={s.page}>
            {/* Header */}
            <header style={s.header}>
                <div style={s.headerInner}>
                    <Link href="/" style={s.logo}>Ouch!</Link>
                    <p style={s.tagline}>Nơi thất bại được lắng nghe</p>
                </div>
            </header>

            {/* Card */}
            <div style={s.wrapper}>
                <div style={s.card}>
                    <div style={s.cardHeader}>
                        <div style={s.iconWrap}>
                            <span style={s.icon}>🔥</span>
                        </div>
                        <h1 style={s.title}>
                            {mode === "login" ? "Chào mừng trở lại" : "Tham gia cộng đồng"}
                        </h1>
                        <p style={s.subtitle}>
                            {mode === "login"
                                ? "Đăng nhập để chia sẻ thất bại của bạn"
                                : "Nơi thất bại được lắng nghe và đồng cảm"}
                        </p>
                    </div>

                    {/* Toggle */}
                    <div style={s.toggle}>
                        <button
                            style={{ ...s.toggleBtn, ...(mode === "login" ? s.toggleActive : {}) }}
                            onClick={() => { setMode("login"); setError(null); setSuccessMsg(null) }}>
                            Đăng nhập
                        </button>
                        <button
                            style={{ ...s.toggleBtn, ...(mode === "register" ? s.toggleActive : {}) }}
                            onClick={() => { setMode("register"); setError(null); setSuccessMsg(null) }}>
                            Đăng ký
                        </button>
                    </div>

                    {/* Form */}
                    <div style={s.form}>
                        {mode === "register" && (
                            <div style={s.fieldGroup}>
                                <label style={s.label}>Tên hiển thị</label>
                                <input
                                    style={s.input}
                                    type="text"
                                    placeholder="Tên của bạn"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                                />
                            </div>
                        )}

                        <div style={s.fieldGroup}>
                            <label style={s.label}>Email</label>
                            <input
                                style={s.input}
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                            />
                        </div>

                        <div style={s.fieldGroup}>
                            <label style={s.label}>Mật khẩu</label>
                            <input
                                style={s.input}
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                            />
                        </div>

                        {error && (
                            <div style={s.errorBox}>
                                <span>⚠</span>
                                <span>{error}</span>
                            </div>
                        )}

                        {successMsg && (
                            <div style={s.successBox}>
                                <span>✓</span>
                                <span>{successMsg}</span>
                            </div>
                        )}

                        <button
                            style={{ ...s.submitBtn, ...(submitting ? s.submitDisabled : {}) }}
                            onClick={handleSubmit}
                            disabled={submitting}>
                            {submitting ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function mapError(msg: string): string {
    if (msg.includes("Invalid login credentials")) return "Email hoặc mật khẩu không đúng."
    if (msg.includes("Email not confirmed")) return "Email chưa được xác nhận. Kiểm tra hộp thư."
    if (msg.includes("User already registered")) return "Email này đã được đăng ký."
    if (msg.includes("Password should be")) return "Mật khẩu tối thiểu 6 ký tự."
    return msg
}

const s: Record<string, React.CSSProperties> = {
    page: { minHeight: "100vh", background: "#1D1616", display: "flex", flexDirection: "column" },
    header: {
        background: "linear-gradient(135deg, #D84040 0%, #8E1616 50%, #1D1616 100%)",
        borderBottom: "1px solid rgba(142,22,22,0.4)"
    },
    headerInner: {
        maxWidth: "720px", margin: "0 auto", padding: "28px 24px 24px",
        display: "flex", flexDirection: "column", gap: "4px"
    },
    logo: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "900", fontSize: "42px",
        color: "#EEEEEE", letterSpacing: "-2px", textDecoration: "none",
        textShadow: "0 2px 24px rgba(0,0,0,0.4)"
    },
    tagline: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "500",
        fontSize: "12px", color: "rgba(238,238,238,0.45)", letterSpacing: "0.3px"
    },
    wrapper: {
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", padding: "40px 24px"
    },
    card: {
        width: "100%", maxWidth: "420px",
        background: "rgba(238,238,238,0.03)",
        border: "1px solid rgba(142,22,22,0.3)",
        borderRadius: "20px",
        padding: "36px 32px",
        display: "flex", flexDirection: "column", gap: "24px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
    },
    cardHeader: { display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" },
    iconWrap: {
        width: "56px", height: "56px", borderRadius: "16px",
        background: "rgba(216,64,64,0.15)", border: "1px solid rgba(216,64,64,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "4px"
    },
    icon: { fontSize: "26px" },
    title: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "800",
        fontSize: "22px", color: "#EEEEEE", letterSpacing: "-0.5px", textAlign: "center"
    },
    subtitle: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "500",
        fontSize: "12px", color: "rgba(238,238,238,0.4)", textAlign: "center", lineHeight: "1.6"
    },
    toggle: {
        display: "flex", background: "rgba(238,238,238,0.04)",
        borderRadius: "10px", padding: "3px", gap: "3px"
    },
    toggleBtn: {
        flex: 1, padding: "9px",
        background: "transparent", border: "none", borderRadius: "8px",
        color: "rgba(238,238,238,0.35)",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "12px", letterSpacing: "0.3px", cursor: "pointer"
    },
    toggleActive: { background: "rgba(216,64,64,0.18)", color: "#EEEEEE" },
    form: { display: "flex", flexDirection: "column", gap: "14px" },
    fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
    label: {
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600",
        fontSize: "10px", letterSpacing: "1px",
        textTransform: "uppercase", color: "rgba(238,238,238,0.4)"
    },
    input: {
        width: "100%", padding: "11px 14px",
        background: "rgba(238,238,238,0.04)",
        border: "1px solid rgba(142,22,22,0.4)",
        borderRadius: "10px", color: "#EEEEEE",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "500",
        fontSize: "13px", outline: "none", caretColor: "#D84040"
    },
    errorBox: {
        display: "flex", alignItems: "flex-start", gap: "8px",
        padding: "10px 12px",
        background: "rgba(216,64,64,0.08)", border: "1px solid rgba(216,64,64,0.25)",
        borderRadius: "8px", color: "#D84040",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600", fontSize: "11px", lineHeight: "1.5"
    },
    successBox: {
        display: "flex", alignItems: "center", gap: "8px",
        padding: "10px 12px",
        background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)",
        borderRadius: "8px", color: "rgba(134,239,172,0.9)",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "600", fontSize: "11px"
    },
    submitBtn: {
        width: "100%", padding: "13px",
        background: "linear-gradient(135deg, #D84040 0%, #8E1616 100%)",
        border: "none", borderRadius: "10px", color: "#EEEEEE",
        fontFamily: "'Montserrat', sans-serif", fontWeight: "800",
        fontSize: "13px", letterSpacing: "1px", textTransform: "uppercase",
        cursor: "pointer", boxShadow: "0 4px 16px rgba(216,64,64,0.25)", marginTop: "4px"
    },
    submitDisabled: { opacity: 0.45, cursor: "not-allowed", boxShadow: "none" }
}