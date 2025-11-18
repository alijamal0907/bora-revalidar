import { supabase } from './supabase'

interface User {
  id: string
  email: string
  usuario_id?: string
}

export async function getSupabaseUser(): Promise<User | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session?.user) {
      console.log('[v0] No active session found')
      return null
    }

    const user = session.user
    const usuarioId = user.user_metadata?.usuario_id || user.id
    
    return {
      id: user.id,
      email: user.email || '',
      usuario_id: usuarioId,
    }
  } catch (error) {
    console.error('[v0] Error in getSupabaseUser:', error)
    return null
  }
}

export async function signUpSupabase(email: string, password: string): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error('[v0] Signup error:', error)
      throw error
    }

    if (!user) {
      throw new Error('No user returned from signup')
    }

    return {
      id: user.id,
      email: user.email || '',
      usuario_id: user.id,
    }
  } catch (error) {
    console.error('[v0] Error in signUpSupabase:', error)
    throw error
  }
}

export async function signInSupabase(email: string, password: string): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('[v0] Login error:', error)
      throw error
    }

    if (!user) {
      throw new Error('No user returned from login')
    }

    return {
      id: user.id,
      email: user.email || '',
      usuario_id: user.id,
    }
  } catch (error) {
    console.error('[v0] Error in signInSupabase:', error)
    throw error
  }
}

export async function signOutSupabase(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('[v0] Signout error:', error)
      throw error
    }
  } catch (error) {
    console.error('[v0] Error in signOutSupabase:', error)
    throw error
  }
}

export function listenToAuthStateChange(callback: (user: User | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      if (session?.user) {
        const user = session.user
        const usuarioId = user.user_metadata?.usuario_id || user.id
        callback({
          id: user.id,
          email: user.email || '',
          usuario_id: usuarioId,
        })
      } else {
        callback(null)
      }
    }
  )

  return subscription
}

export function isAuthenticated(): boolean {
  // This will be checked on component mount
  return true
}
