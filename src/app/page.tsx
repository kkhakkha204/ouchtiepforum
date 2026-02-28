import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import SubNavbar from "@/components/SubNavbar"
import FeedClient from "@/components/FeedClient"

export const revalidate = 60

export default async function Home() {
    const { data: confessions } = await supabase
        .from("confessions")
        .select("id, content, field, position, level, is_anonymous, created_at, image_urls, user_id")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20)

    return (
        <main>
            <Navbar />
            <SubNavbar />
            <FeedClient initialConfessions={confessions ?? []} />
        </main>
    )
}