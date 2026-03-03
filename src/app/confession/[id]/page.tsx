import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import ConfessionDetail from "@/components/ConfessionDetail"
import { notFound } from "next/navigation"
import SubNavbar from "@/components/SubNavbar";

export default async function ConfessionPage({
                                                 params
                                             }: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const { data: confession } = await supabase
        .from("confessions")
        .select("id, content, field, position, level, is_anonymous, created_at, image_urls, user_id")
        .eq("id", id)
        .eq("is_public", true)
        .single()

    if (!confession) notFound()

    const { data: comments } = await supabase
        .from("comments")
        .select("id, content, is_anonymous, created_at, user_id, parent_id")
        .eq("confession_id", id)
        .order("created_at", { ascending: true })

    return (
        <main>
            <Navbar />
            <SubNavbar/>
            <ConfessionDetail
                confession={confession}
                initialComments={comments ?? []}
            />
        </main>
    )
}