import { createBrowserClient } from "@supabase/ssr"

const client: ReturnType<typeof createBrowserClient> | null = null

const getGlobalClient = () => {
  if (typeof window === "undefined") return null

  if (!(window as any).__supabaseClient) {
    ;(window as any).__supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }

  return (window as any).__supabaseClient
}

export function createClient() {
  return getGlobalClient()!
}
