import { supabase } from "./supabase"

interface User {
  id: string
  email: string
  usuario_id?: string
}

export async function getSupabaseUser(): Promise<User | null> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      if (error.message.includes("Invalid Refresh Token") || error.message.includes("Refresh Token Not Found")) {
        console.log("[v0] Invalid refresh token, clearing session")
        await supabase.auth.signOut()
        return null
      }
      console.log("[v0] No active session found:", error.message)
      return null
    }

    if (!session?.user) {
      console.log("[v0] No active session found")
      return null
    }

    const user = session.user
    const usuarioId = user.user_metadata?.usuario_id || user.id

    return {
      id: user.id,
      email: user.email || "",
      usuario_id: usuarioId,
    }
  } catch (error: any) {
    if (error?.message?.includes("Invalid Refresh Token") || error?.message?.includes("Refresh Token Not Found")) {
      console.log("[v0] Invalid refresh token caught, clearing session")
      try {
        await supabase.auth.signOut()
      } catch (e) {
        // Ignore signout errors
      }
      return null
    }
    console.error("[v0] Error in getSupabaseUser:", error)
    return null
  }
}

export async function signUpSupabase(email: string, password: string): Promise<User | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error("[v0] Signup error:", error)
      throw error
    }

    if (!user) {
      throw new Error("No user returned from signup")
    }

    return {
      id: user.id,
      email: user.email || "",
      usuario_id: user.id,
    }
  } catch (error) {
    console.error("[v0] Error in signUpSupabase:", error)
    throw error
  }
}

export async function signInSupabase(email: string, password: string): Promise<User | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("[v0] Login error:", error)
      throw error
    }

    if (!user) {
      throw new Error("No user returned from login")
    }

    return {
      id: user.id,
      email: user.email || "",
      usuario_id: user.id,
    }
  } catch (error) {
    console.error("[v0] Error in signInSupabase:", error)
    throw error
  }
}

export async function signOutSupabase(): Promise<void> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      if (error.message.includes("Invalid Refresh Token") || error.message.includes("Refresh Token Not Found")) {
        console.log("[v0] Invalid token during logout, clearing local storage")
        // Clear local storage manually
        if (typeof window !== "undefined") {
          localStorage.removeItem("supabase.auth.token")
        }
        return
      }
    }

    // If there's no session, just return successfully
    if (!session) {
      console.log("[v0] No session to sign out from")
      return
    }

    const { error: signoutError } = await supabase.auth.signOut()
    if (signoutError) {
      // Ignore AuthSessionMissingError and refresh token errors
      if (
        signoutError.message.includes("Auth session missing") ||
        signoutError.message.includes("Invalid Refresh Token") ||
        signoutError.message.includes("Refresh Token Not Found")
      ) {
        console.log("[v0] Session already cleared")
        return
      }
      console.error("[v0] Signout error:", signoutError)
      throw signoutError
    }
  } catch (error: any) {
    // Gracefully handle session missing and refresh token errors
    if (
      error?.message?.includes("Auth session missing") ||
      error?.message?.includes("Invalid Refresh Token") ||
      error?.message?.includes("Refresh Token Not Found")
    ) {
      console.log("[v0] Session already cleared, continuing with logout")
      return
    }
    console.error("[v0] Error in signOutSupabase:", error)
    throw error
  }
}

export function listenToAuthStateChange(callback: (user: User | null) => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      const user = session.user
      const usuarioId = user.user_metadata?.usuario_id || user.id
      callback({
        id: user.id,
        email: user.email || "",
        usuario_id: usuarioId,
      })
    } else {
      callback(null)
    }
  })

  return subscription
}

export function isAuthenticated(): boolean {
  // This will be checked on component mount
  return true
}

export async function getCurrentUser(): Promise<User | null> {
  return await getSupabaseUser()
}
