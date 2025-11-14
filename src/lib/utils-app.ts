// Helpers e utilitários do app

import { INTERVALOS_REVISAO } from "./constants";

// Calcular próxima revisão de flashcard (SM-2 simplificado)
export function calcularProximaRevisao(qualidade: number, nivelAtual: number): { novoNivel: number; diasProxRevisao: number } {
  let novoNivel = nivelAtual;

  if (qualidade >= 4) {
    // Acertou bem
    novoNivel = Math.min(nivelAtual + 1, INTERVALOS_REVISAO.length - 1);
  } else if (qualidade <= 2) {
    // Errou ou dificuldade
    novoNivel = 0;
  }
  // qualidade 3 mantém nível

  const diasProxRevisao = INTERVALOS_REVISAO[novoNivel];
  return { novoNivel, diasProxRevisao };
}

// Verificar se usuário atingiu limite free
export function verificarLimite(tipo: "questoes" | "cards" | "iaExplicacoes" | "simulados", usado: number, isPremium: boolean, limites: any): boolean {
  if (isPremium) return false; // Premium não tem limites

  switch (tipo) {
    case "questoes":
      return usado >= limites.questoesDia;
    case "cards":
      return usado >= limites.cardsDia;
    case "iaExplicacoes":
      return usado >= limites.iaExplicacoesDia;
    case "simulados":
      return usado >= limites.simuladosMes;
    default:
      return false;
  }
}

// Calcular percentual de acerto
export function calcularPercentual(acertos: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((acertos / total) * 100);
}

// Formatar tempo em segundos para MM:SS
export function formatarTempo(segundos: number): string {
  const mins = Math.floor(segundos / 60);
  const secs = segundos % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Calcular dias até a prova
export function diasAteProva(dataProva: string | null): number | null {
  if (!dataProva) return null;
  const hoje = new Date();
  const prova = new Date(dataProva);
  const diff = prova.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Gerar cor baseada em percentual (vermelho -> amarelo -> verde)
export function corPorPercentual(percentual: number): string {
  if (percentual < 50) return "#C44536"; // Vermelho
  if (percentual < 70) return "#F59E0B"; // Amarelo
  return "#10B981"; // Verde
}

// Validar email
export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Hash simples de senha (ATENÇÃO: em produção use bcrypt)
export async function hashSenha(senha: string): Promise<string> {
  // Simulação - em produção use bcrypt ou similar
  return `hashed_${senha}`;
}

// Verificar senha
export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  // Simulação - em produção use bcrypt.compare
  return hash === `hashed_${senha}`;
}
