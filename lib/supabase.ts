import { createClient } from "./supabase/client"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("[v0] Missing Supabase environment variables")
}

// Exportar função ao invés de instância global
export const getSupabaseClient = () => createClient(supabaseUrl || "", supabaseAnonKey || "")

// Manter compatibilidade com código existente
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "")

// Helper functions for database operations
export async function getQuestoes(limit = 100) {
  const client = getSupabaseClient()
  const { data, error } = await client.from("questoes").select("*").limit(limit)

  if (error) {
    console.error("[v0] Error fetching questoes:", error)
    throw error
  }
  return data
}

export async function getHistQuestoes(usuarioId: string) {
  const client = getSupabaseClient()
  const { data, error } = await client.from("hist_questoes").select("*").eq("usuario_id", usuarioId)

  if (error) {
    console.error("[v0] Error fetching hist_questoes:", error)
    throw error
  }
  return data
}

export async function getMarcacoesRevisao(usuarioId: string) {
  const client = getSupabaseClient()
  const { data, error } = await client.from("marcacoes_revisao").select("*").eq("usuario_id", usuarioId)

  if (error) {
    console.error("[v0] Error fetching marcacoes_revisao:", error)
    throw error
  }
  return data
}

export async function getAssinaturas(usuarioId: string) {
  const client = getSupabaseClient()
  const { data, error } = await client.from("assinaturas").select("*").eq("usuario_id", usuarioId)

  if (error) {
    console.error("[v0] Error fetching assinaturas:", error)
    throw error
  }
  return data
}

export async function getUserDevices(usuarioId: string) {
  const client = getSupabaseClient()
  const { data, error } = await client.from("user_devices").select("*").eq("usuario_id", usuarioId)

  if (error) {
    console.error("[v0] Error fetching user_devices:", error)
    throw error
  }
  return data
}

export async function getUserMetas(usuarioId: string) {
  const client = getSupabaseClient()
  const { data, error } = await client.from("user_metas").select("*").eq("usuario_id", usuarioId)

  if (error) {
    console.error("[v0] Error fetching user_metas:", error)
    throw error
  }
  return data
}

export async function insertHistQuestao(histQuestao: any) {
  const client = getSupabaseClient()
  const { data, error } = await client.from("hist_questoes").insert([histQuestao])

  if (error) {
    console.error("[v0] Error inserting hist_questao:", error)
    throw error
  }
  return data
}

export async function updateMarcacaoRevisao(id: string, updates: any) {
  const client = getSupabaseClient()
  const { data, error } = await client.from("marcacoes_revisao").update(updates).eq("id", id)

  if (error) {
    console.error("[v0] Error updating marcacao_revisao:", error)
    throw error
  }
  return data
}
