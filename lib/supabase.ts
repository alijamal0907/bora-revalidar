import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[v0] Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Helper functions for database operations
export async function getQuestoes(limit = 100) {
  const { data, error } = await supabase
    .from('questoes')
    .select('*')
    .limit(limit)
  
  if (error) {
    console.error('[v0] Error fetching questoes:', error)
    throw error
  }
  return data
}

export async function getHistQuestoes(usuarioId: string) {
  const { data, error } = await supabase
    .from('hist_questoes')
    .select('*')
    .eq('usuario_id', usuarioId)
  
  if (error) {
    console.error('[v0] Error fetching hist_questoes:', error)
    throw error
  }
  return data
}

export async function getMarcacoesRevisao(usuarioId: string) {
  const { data, error } = await supabase
    .from('marcacoes_revisao')
    .select('*')
    .eq('usuario_id', usuarioId)
  
  if (error) {
    console.error('[v0] Error fetching marcacoes_revisao:', error)
    throw error
  }
  return data
}

export async function getAssinaturas(usuarioId: string) {
  const { data, error } = await supabase
    .from('assinaturas')
    .select('*')
    .eq('usuario_id', usuarioId)
  
  if (error) {
    console.error('[v0] Error fetching assinaturas:', error)
    throw error
  }
  return data
}

export async function getUserDevices(usuarioId: string) {
  const { data, error } = await supabase
    .from('user_devices')
    .select('*')
    .eq('usuario_id', usuarioId)
  
  if (error) {
    console.error('[v0] Error fetching user_devices:', error)
    throw error
  }
  return data
}

export async function getUserMetas(usuarioId: string) {
  const { data, error } = await supabase
    .from('user_metas')
    .select('*')
    .eq('usuario_id', usuarioId)
  
  if (error) {
    console.error('[v0] Error fetching user_metas:', error)
    throw error
  }
  return data
}

export async function insertHistQuestao(histQuestao: any) {
  const { data, error } = await supabase
    .from('hist_questoes')
    .insert([histQuestao])
  
  if (error) {
    console.error('[v0] Error inserting hist_questao:', error)
    throw error
  }
  return data
}

export async function updateMarcacaoRevisao(id: string, updates: any) {
  const { data, error } = await supabase
    .from('marcacoes_revisao')
    .update(updates)
    .eq('id', id)
  
  if (error) {
    console.error('[v0] Error updating marcacao_revisao:', error)
    throw error
  }
  return data
}
