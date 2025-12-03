import { createBrowserClient } from "@supabase/ssr"

declare global {
  var __supabase_client: ReturnType<typeof createBrowserClient> | undefined
}

export function createClient() {
  if (typeof window === "undefined") {
    throw new Error("Supabase client can only be used in browser context")
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  if (!globalThis.__supabase_client) {
    globalThis.__supabase_client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "sb-fmhzwcbjjdkcylohqfyy-auth-token", // storageKey consistente
      },
    })
  }

  return globalThis.__supabase_client
}
