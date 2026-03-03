import { notFound } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase-server"
import Navbar from "@/components/Navbar"
import SubNavbar from "@/components/SubNavbar"
import ProfileClient from "@/components/ProfileClient"

export const revalidate = 60

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params  // ✅ await params (Next.js 15+)

    const supabase = await createSupabaseServer()

    // ✅ dùng getUser() thay vì getSession()
    const { data: { user } } = await supabase.auth.getUser()
    const isOwner = user?.id === id

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, display_name, anonymous_name, bio, website, avatar_url, cover_url")
        .eq("id", id)
        .single()

    if (!profile) notFound()

    let query = supabase
        .from("confessions")
        .select("id, content, field, position, level, is_anonymous, created_at, image_urls, user_id")
        .eq("user_id", id)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20)

    if (!isOwner) {
        query = query.eq("is_anonymous", false)
    }

    const { data: confessions } = await query

    return (
        <main>
            <SubNavbar />
            <ProfileClient
                profile={profile}
                confessions={confessions ?? []}
                isOwner={isOwner}
                currentUserId={user?.id ?? null}
            />
        </main>
    )
}