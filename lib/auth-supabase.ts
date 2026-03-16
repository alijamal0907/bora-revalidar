import { createClient } from "@/lib/supabase/client"

export function getSupabaseClient() {
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

export async function updateUserPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient()

    // Verificar se o usuário está autenticado
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return {
        success: false,
        error: "Você precisa estar logado para alterar a senha",
      }
    }

    // Validar senha
    if (newPassword.length < 6) {
      return {
        success: false,
        error: "A senha deve ter pelo menos 6 caracteres",
      }
    }

    // Atualizar senha
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return {
        success: false,
        error: error.message || "Erro ao atualizar senha",
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Password update error:", error)
    return {
      success: false,
      error: error.message || "Erro ao atualizar senha",
    }
  }
}

export async function sendPasswordResetOTP(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient()

    // Enviar OTP para o email
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Não criar usuário novo
      },
    })

    if (error) {
      return {
        success: false,
        error: error.message || "Erro ao enviar código",
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Send OTP error:", error)
    return {
      success: false,
      error: error.message || "Erro ao enviar código",
    }
  }
}

export async function verifyOTPAndResetPassword(
  email: string,
  token: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient()

    // Validar senha
    if (newPassword.length < 6) {
      return {
        success: false,
        error: "A senha deve ter pelo menos 6 caracteres",
      }
    }

    // Verificar o OTP
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    })

    if (verifyError) {
      return {
        success: false,
        error: "Código inválido ou expirado",
      }
    }

    // Atualizar a senha
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      return {
        success: false,
        error: updateError.message || "Erro ao atualizar senha",
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Verify OTP and reset password error:", error)
    return {
      success: false,
      error: error.message || "Erro ao verificar código e atualizar senha",
    }
  }
}

export async function getCurrentUser(): Promise<User | null> {
  return await getSupabaseUser()
}
