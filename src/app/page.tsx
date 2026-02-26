import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import FeedClient from "@/components/FeedClient"

export const revalidate = 60

export default async function Home() {
  const { data: confessions } = await supabase
      .from("confessions")
      .select("id, content, field, position, level, is_anonymous, created_at, image_urls")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(20)

  return (
      <main>
        <Navbar />
        <FeedClient initialConfessions={confessions ?? []} />
      </main>
  )
}