"use server";

import { supabase } from "@/lib/supabase";
import { QUESTOES_SEED } from "@/lib/questoes-seed";

// Popular banco com questões seed
export async function popularQuestoesSeed() {
  try {
    // Verificar se já existem questões
    const { data: existentes, error: erroCheck } = await supabase
      .from("questoes")
      .select("id")
      .limit(1);

    if (erroCheck) {
      console.error("Erro ao verificar questões:", erroCheck);
      return { success: false, error: erroCheck.message };
    }

    if (existentes && existentes.length > 0) {
      return { success: true, message: "Questões já existem no banco" };
    }

    // Inserir questões seed
    const questoesFormatadas = QUESTOES_SEED.map((q) => ({
      ano: q.ano,
      prova: q.prova,
      caderno: q.caderno,
      numero: q.numero,
      enunciado: q.enunciado,
      alternativa_a: q.alternativa_a,
      alternativa_b: q.alternativa_b,
      alternativa_c: q.alternativa_c,
      alternativa_d: q.alternativa_d,
      alternativa_e: q.alternativa_e,
      correta: q.correta,
      tema: q.tema,
      subtema: q.subtema,
      dificuldade: q.dificuldade,
      tags: q.tags,
      fontes_base: q.fontes_base,
      imagem_url: null,
    }));

    const { data, error } = await supabase.from("questoes").insert(questoesFormatadas);

    if (error) {
      console.error("Erro ao inserir questões:", error);
      return { success: false, error: error.message };
    }

    return { success: true, message: `${QUESTOES_SEED.length} questões inseridas com sucesso` };
  } catch (error: any) {
    console.error("Erro geral:", error);
    return { success: false, error: error.message };
  }
}

// Criar usuário admin
export async function criarUsuarioAdmin() {
  try {
    // Verificar se admin já existe
    const { data: existente, error: erroCheck } = await supabase
      .from("usuarios")
      .select("id")
      .eq("email", "admin@borarevalidar.app")
      .single();

    if (existente) {
      return { success: true, message: "Usuário admin já existe" };
    }

    // Criar admin
    const { data, error } = await supabase.from("usuarios").insert({
      nome: "Admin",
      email: "admin@borarevalidar.app",
      senha_hash: "hashed_Bora!2025", // Simulação - em produção use bcrypt
      is_premium: true,
      role: "admin",
      meta_questoes_dia: 100,
      meta_cards_dia: 50,
      horas_semana: 20,
    });

    if (error) {
      console.error("Erro ao criar admin:", error);
      return { success: false, error: error.message };
    }

    return { success: true, message: "Usuário admin criado com sucesso" };
  } catch (error: any) {
    console.error("Erro geral:", error);
    return { success: false, error: error.message };
  }
}

// Inicializar banco (questões + admin)
export async function inicializarBanco() {
  const resultadoQuestoes = await popularQuestoesSeed();
  const resultadoAdmin = await criarUsuarioAdmin();

  return {
    questoes: resultadoQuestoes,
    admin: resultadoAdmin,
  };
}
