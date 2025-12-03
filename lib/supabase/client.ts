import { createBrowserClient } from "@supabase/ssr"

const getGlobalClient = () => {
  if (typeof window === "undefined") return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Supabase] Missing environment variables:", {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey,
    })
    return null
  }

  if (!(window as any).__supabaseClient) {
    try {
      ;(window as any).__supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
    } catch (error) {
      console.error("[Supabase] Error creating client:", error)
      return null
    }
  }

  return (window as any).__supabaseClient
}

export function createClient() {
  const client = getGlobalClient()

  if (!client) {
    throw new Error(
      "Failed to initialize Supabase client. Please check your environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    )
  }

  return client
}
