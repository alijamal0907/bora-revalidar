import { createClient } from '@supabase/supabase-js';

// Validar variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Verificar se as credenciais são válidas
const isValidConfig = supabaseUrl && 
                      supabaseAnonKey && 
                      supabaseUrl.includes('supabase.co') &&
                      supabaseAnonKey.length > 20;

// Criar cliente apenas se configuração for válida
export const supabase = isValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'x-client-info': 'supabase-js-web'
        }
      }
    })
  : null;

// Helper para verificar se Supabase está configurado
export function isSupabaseConfigured(): boolean {
  return isValidConfig && supabase !== null;
}

// ========== FUNÇÕES DE AUTENTICAÇÃO COM VALIDAÇÃO ==========

/**
 * Criar nova conta com email e senha
 */
export async function signUp(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    return { 
      data: null, 
      error: { 
        message: 'Supabase não está configurado. Configure as variáveis de ambiente.',
        name: 'ConfigError',
        status: 500
      } 
    };
  }

  try {
    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/home`,
        data: {
          email_confirm: false
        }
      }
    });
    
    return { data, error };
  } catch (err: any) {
    console.error('Erro no signUp:', err);
    return {
      data: null,
      error: {
        message: err.message || 'Erro de conexão. Verifique sua internet.',
        name: 'NetworkError',
        status: 0
      }
    };
  }
}

/**
 * Login com email e senha
 */
export async function signIn(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    return { 
      data: null, 
      error: { 
        message: 'Supabase não está configurado. Configure as variáveis de ambiente.',
        name: 'ConfigError',
        status: 500
      } 
    };
  }

  try {
    const { data, error } = await supabase!.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  } catch (err: any) {
    console.error('Erro no signIn:', err);
    return {
      data: null,
      error: {
        message: err.message || 'Erro de conexão. Verifique sua internet.',
        name: 'NetworkError',
        status: 0
      }
    };
  }
}

/**
 * Logout do usuário atual
 */
export async function signOut() {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  try {
    const { error } = await supabase!.auth.signOut();
    return { error };
  } catch (err: any) {
    console.error('Erro no signOut:', err);
    return {
      error: {
        message: err.message || 'Erro ao fazer logout',
        name: 'NetworkError',
        status: 0
      }
    };
  }
}

/**
 * Obter usuário autenticado atual
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return { user: null, error: null };
  }

  try {
    const { data: { user }, error } = await supabase!.auth.getUser();
    return { user, error };
  } catch (err: any) {
    console.error('Erro ao obter usuário:', err);
    return {
      user: null,
      error: {
        message: err.message || 'Erro ao verificar usuário',
        name: 'NetworkError',
        status: 0
      }
    };
  }
}

/**
 * Verificar se há sessão ativa
 */
export async function getSession() {
  if (!isSupabaseConfigured()) {
    return { session: null, error: null };
  }

  try {
    const { data: { session }, error } = await supabase!.auth.getSession();
    return { session, error };
  } catch (err: any) {
    console.error('Erro ao obter sessão:', err);
    return {
      session: null,
      error: {
        message: err.message || 'Erro ao verificar sessão',
        name: 'NetworkError',
        status: 0
      }
    };
  }
}

// ========== TYPES DO BANCO DE DADOS ==========

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  is_premium: boolean;
  data_prova: string | null;
  meta_questoes_dia: number;
  meta_cards_dia: number;
  horas_semana: number;
  created_at: string;
  role: 'user' | 'admin';
};

export type Questao = {
  id: string;
  ano: number;
  prova: string;
  caderno: string;
  numero: number;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  alternativa_e: string;
  correta: 'A' | 'B' | 'C' | 'D' | 'E';
  tema: string;
  subtema: string;
  dificuldade: number;
  tags: string[];
  fontes_base: any;
  imagem_url: string | null;
};

export type HistQuestao = {
  id: string;
  user_id: string;
  questao_id: string;
  resposta: 'A' | 'B' | 'C' | 'D' | 'E';
  correta: boolean;
  origem: 'estudo' | 'simulado';
  timestamp: string;
};

export type Flashcard = {
  id: string;
  user_id: string;
  frente: string;
  verso: string;
  tema: string;
  subtema: string;
  nivel: number;
  prox_revisao: string;
  qualidade_ultima: number;
  tags: string[];
};

export type Simulado = {
  id: string;
  user_id: string;
  config: any;
  inicio: string;
  fim: string | null;
  acertos: number;
  tempo_segundos: number;
  detalhes_por_tema: any;
};

export type HistoricoSimulado = {
  id: string;
  user_id: string;
  data_hora: string;
  tema_ou_geral: string;
  total_questoes: number;
  acertos: number;
  percentual: number;
};

export type Fonte = {
  id: string;
  titulo: string;
  tipo: 'diretriz' | 'livro' | 'artigo' | 'guia' | 'site';
  url_ou_arquivo: string;
  ano: number;
  tags: string[];
};
