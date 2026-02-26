"use client"
import { FIELDS } from "@/constants/fields"
const ALL_FIELDS = ["", ...FIELDS]

export default function FilterBar({ selected, onChange }: {
    selected: string
    onChange: (field: string) => void
}) {
    return (
        <div style={styles.bar}>
            {ALL_FIELDS.map((f) => (
                <button
                    key={f}
                    style={{
                        ...styles.btn,
                        ...(selected === f ? styles.btnActive : {})
                    }}
                    onClick={() => onChange(f)}
                >
                    {f === "" ? "Tất cả" : f}
                </button>
            ))}
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
    bar: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginBottom: "20px"
    },
    btn: {
        padding: "6px 14px",
        background: "rgba(238,238,238,0.04)",
        border: "1px solid rgba(142,22,22,0.3)",
        borderRadius: "20px",
        color: "rgba(238,238,238,0.35)",
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "600",
        fontSize: "11px",
        cursor: "pointer",
        letterSpacing: "0.3px"
    },
    btnActive: {
        background: "rgba(216,64,64,0.12)",
        border: "1px solid rgba(216,64,64,0.5)",
        color: "#EEEEEE"
    }
}