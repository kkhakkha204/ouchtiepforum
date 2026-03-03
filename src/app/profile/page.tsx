import { redirect } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase-server"

export default async function ProfileRedirect() {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()  // ✅ getUser()

    if (!user) redirect("/auth")
    redirect(`/profile/${user.id}`)
}