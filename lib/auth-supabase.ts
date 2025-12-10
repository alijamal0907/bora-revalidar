import { createClient } from "@/lib/supabase/client"

function getSupabaseClient() {
  return createClient()
}

interface User {
  id: string
  email: string
  usuario_id?: string
}

export async function getSupabaseUser(): Promise<User | null> {
  try {
    if (typeof window === "undefined") {
      return null
    }

    const supabase = getSupabaseClient()
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session?.user) {
      return null
    }

    const user = session.user
    return {
      id: user.id,
      email: user.email || "",
      usuario_id: user.user_metadata?.usuario_id || user.id,
    }
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

export async function signUpSupabase(email: string, password: string): Promise<User | null> {
  try {
    const supabase = getSupabaseClient()
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Signup failed")
    }

    if (!data.user) {
      throw new Error("No user returned from signup")
    }

    // Auto login after signup
    const {
      data: { user },
      error,
    } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !user) {
      // Return user even if auto-login fails
      return {
        id: data.user.id,
        email: data.user.email || "",
        usuario_id: data.user.id,
      }
    }

    return {
      id: user.id,
      email: user.email || "",
      usuario_id: user.id,
    }
  } catch (error: any) {
    console.error("Signup error:", error)
    throw error
  }
}

export async function signInSupabase(email: string, password: string): Promise<User | null> {
  try {
    const supabase = getSupabaseClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
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
    console.error("Login error:", error)
    throw error
  }
}

export async function signOutSupabase(): Promise<void> {
  try {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
  } catch (error) {
    console.error("Signout error:", error)
  }
}

export function listenToAuthStateChange(callback: (user: User | null) => void) {
  const supabase = getSupabaseClient()
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      const user = session.user
      callback({
        id: user.id,
        email: user.email || "",
        usuario_id: user.user_metadata?.usuario_id || user.id,
      })
    } else {
      callback(null)
    }
  })

  return subscription
}

export async function resetPasswordForEmail(email: string): Promise<void> {
  try {
    const supabase = getSupabaseClient()

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")
    const redirectUrl = `${siteUrl}/reset-password`

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("Password reset request error:", error)
    throw error
  }
}

export async function updatePassword(newPassword: string): Promise<void> {
  try {
    const supabase = getSupabaseClient()

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      throw new Error("Você precisa estar autenticado para alterar a senha. O link pode ter expirado.")
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("Password update error:", error)
    throw error
  }
}

export async function getCurrentUser(): Promise<User | null> {
  return await getSupabaseUser()
}
