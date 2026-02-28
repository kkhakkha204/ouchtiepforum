"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import ConfessionCard from "./ConfessionCard"
import FilterBar from "./FilterBar"

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

export default function FeedClient({
                                       initialConfessions,
                                       showFilter = true
                                   }: {
    initialConfessions: Confession[]
    showFilter?: boolean
}) {
    const [userId, setUserId] = useState<string | null>(null)
    const [confessions, setConfessions] = useState(initialConfessions)
    const [field, setField] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id ?? null)
        })
    }, [])

    const handleFilter = async (selectedField: string) => {
        setField(selectedField)
        setLoading(true)

        let query = supabase
            .from("confessions")
            .select("id, content, field, position, level, is_anonymous, created_at, image_urls, user_id")
            .eq("is_public", true)
            .order("created_at", { ascending: false })
            .limit(20)

        if (selectedField) {
            query = query.eq("field", selectedField)
        }

        const { data } = await query
        setConfessions(data ?? [])
        setLoading(false)
    }

    return (
        <div style={styles.wrapper}>
            {showFilter && (
                <FilterBar selected={field} onChange={handleFilter} />
            )}

            {loading && (
                <div style={styles.centered}>
                    <div style={styles.spinner} />
                </div>
            )}

            {!loading && confessions.length === 0 && (
                <div style={styles.centered}>
                    <p style={styles.emptyText}>Không có confession nào.</p>
                </div>
            )}

            {!loading && (
                <div style={styles.feed}>
                    {confessions.map((c) => (
                        <ConfessionCard key={c.id} confession={c} userId={userId} />
                    ))}
                </div>
            )}
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
    wrapper: {
        maxWidth: "720px",
        margin: "0 auto",
        padding: "24px 24px 48px"
    },
    feed: {
        display: "flex",
        flexDirection: "column",
        gap: "16px"
    },
    centered: {
        display: "flex",
        justifyContent: "center",
        padding: "48px 0"
    },
    spinner: {
        width: "28px",
        height: "28px",
        border: "2px solid rgba(216,64,64,0.2)",
        borderTop: "2px solid #D84040",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
    },
    emptyText: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "600",
        fontSize: "13px",
        color: "rgba(238,238,238,0.25)"
    }
}