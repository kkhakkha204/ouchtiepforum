import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import SubNavbar from "@/components/SubNavbar"
import FeedClient from "@/components/FeedClient"

interface Props {
    searchParams: Promise<{ q?: string; field?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
    const { q, field } = await searchParams

    let query = supabase
        .from("confessions")
        .select("id, content, field, position, level, is_anonymous, created_at, image_urls")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20)

    if (field) {
        query = query.eq("field", field)
    } else if (q) {
        query = query.ilike("content", `%${q}%`)
    }

    const { data: confessions } = await query

    const title = field
        ? `Lĩnh vực: ${field}`
        : q
            ? `Kết quả cho: "${q}"`
            : "Tìm kiếm"

    return (
        <main>
            <Navbar />
            <SubNavbar />
            <div style={styles.wrapper}>
                <div style={styles.titleRow}>
                    <h2 style={styles.title}>{title}</h2>
                    <span style={styles.count}>
                        {confessions?.length ?? 0} confession
                    </span>
                </div>
                {confessions && confessions.length > 0 ? (
                    <FeedClient initialConfessions={confessions} showFilter={false} />
                ) : (
                    <div style={styles.empty}>
                        <p style={styles.emptyText}>Không tìm thấy confession nào.</p>
                    </div>
                )}
            </div>
        </main>
    )
}

const styles: Record<string, React.CSSProperties> = {
    wrapper: {
        maxWidth: "720px",
        margin: "0 auto",
        padding: "24px 24px 48px"
    },
    titleRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px"
    },
    title: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "800",
        fontSize: "16px",
        color: "#EEEEEE",
        letterSpacing: "-0.3px"
    },
    count: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "600",
        fontSize: "11px",
        color: "rgba(238,238,238,0.25)"
    },
    empty: {
        display: "flex",
        justifyContent: "center",
        padding: "64px 0"
    },
    emptyText: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: "600",
        fontSize: "13px",
        color: "rgba(238,238,238,0.25)"
    }
}