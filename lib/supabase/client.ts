import { createBrowserClient } from "@supabase/ssr"

declare global {
  var __supabase_client: ReturnType<typeof createBrowserClient> | undefined
}

export function createClient() {
  // Retorna null durante SSR/build ao invés de lançar erro
  if (typeof window === "undefined") {
    return null as any
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }

  if (!globalThis.__supabase_client) {
    globalThis.__supabase_client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "sb-auth-token",
      },
    })
  }

  return globalThis.__supabase_client
}

export function getSupabaseClient() {
  return createClient()
}
