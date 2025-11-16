"use server";

import OpenAI from "openai";

// Verificar se a API key está configurada
const apiKey = process.env.OPENAI_API_KEY=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;
const openai = apiKey new OpenAI({ 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 }) : null;

// (A) Explicação com Fontes
export async function explicacaoComFontes(params: {
  enunciado: string;
  alternativas: { A: string; B: string; C: string; D: string; E: string };
  correta: string;
  tema: string;
  subtema: string;
  fontesBase?: any[];
  trechosBiblioteca?: any[];
}) {
  if (!openai) {
    return "Configure a OPENAI_API_KEY para usar esta funcionalidade.";
  }

  const { enunciado, alternativas, correta, tema, subtema, fontesBase = [], trechosBiblioteca = [] } = params;

  const prompt = `Você é um professor especialista em medicina preparando alunos para o REVALIDA.

**QUESTÃO:**
${enunciado}

**ALTERNATIVAS:**
A) ${alternativas.A}
B) ${alternativas.B}
C) ${alternativas.C}
D) ${alternativas.D}
E) ${alternativas.E}

**RESPOSTA CORRETA:** ${correta}
**TEMA:** ${tema}
**SUBTEMA:** ${subtema}

**FONTES DISPONÍVEIS:**
${fontesBase.length > 0 ? JSON.stringify(fontesBase, null, 2) : "Nenhuma fonte específica fornecida"}
${trechosBiblioteca.length > 0 ? `\n\nBiblioteca: ${JSON.stringify(trechosBiblioteca, null, 2)}` : ""}

**INSTRUÇÕES:**
1. Explique por que cada alternativa está CORRETA ou INCORRETA (raciocínio por eliminação A-E)
2. Liste 3 conceitos-chave (bullets) sobre o tema
3. Forneça 2-4 referências bibliográficas (título/ano/link se disponível)
4. Se faltar fonte, mencione e sugira adicionar à biblioteca

Seja objetivo, didático e baseado em evidências.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um professor de medicina especialista em preparação para o REVALIDA. Seja objetivo, didático e sempre cite fontes confiáveis.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    return response.choices[0].message.content || "Erro ao gerar explicação.";
  } catch (error) {
    console.error("Erro na IA:", error);
    return "Erro ao gerar explicação. Tente novamente.";
  }
}

// (B) Gerar Simulado IA
export async function gerarSimuladoIA(params: {
  tema: string;
  qtd: number;
  dificuldade: string;
  userId: string;
  questoesDisponiveis: any[];
  historicoUsuario: any[];
}) {
  const { tema, qtd, dificuldade, questoesDisponiveis, historicoUsuario } = params;

  // Filtrar questões
  let questoesFiltradas = questoesDisponiveis;

  // Filtro por tema
  if (tema !== "Todos") {
    questoesFiltradas = questoesFiltradas.filter((q) => q.tema === tema);
  }

  // Filtro por dificuldade
  if (dificuldade !== "todas") {
    const dif = parseInt(dificuldade);
    questoesFiltradas = questoesFiltradas.filter((q) => q.dificuldade === dif);
  }

  // Evitar questões respondidas nos últimos 7 dias
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
  const idsRecentes = historicoUsuario
    .filter((h) => new Date(h.timestamp) > seteDiasAtras)
    .map((h) => h.questao_id);

  questoesFiltradas = questoesFiltradas.filter((q) => !idsRecentes.includes(q.id));

  // Balancear dificuldade (se "todas")
  let questoesSelecionadas: any[] = [];
  if (dificuldade === "todas" && questoesFiltradas.length >= qtd) {
    const faceis = questoesFiltradas.filter((q) => q.dificuldade <= 2);
    const medias = questoesFiltradas.filter((q) => q.dificuldade === 3);
    const dificeis = questoesFiltradas.filter((q) => q.dificuldade >= 4);

    const qtdFacil = Math.floor(qtd * 0.3);
    const qtdMedia = Math.floor(qtd * 0.5);
    const qtdDificil = qtd - qtdFacil - qtdMedia;

    questoesSelecionadas = [
      ...embaralhar(faceis).slice(0, qtdFacil),
      ...embaralhar(medias).slice(0, qtdMedia),
      ...embaralhar(dificeis).slice(0, qtdDificil),
    ];
  } else {
    questoesSelecionadas = embaralhar(questoesFiltradas).slice(0, qtd);
  }

  // Se "Todos", balancear por tema
  if (tema === "Todos" && questoesSelecionadas.length >= qtd) {
    const temas = ["Clínica Médica", "Ginecologia e Obstetrícia", "Pediatria", "Cirurgia", "Medicina Preventiva e Social", "Ética Médica"];
    const porTema = Math.floor(qtd / temas.length);
    let balanceadas: any[] = [];
    temas.forEach((t) => {
      const doTema = questoesSelecionadas.filter((q) => q.tema === t);
      balanceadas = [...balanceadas, ...doTema.slice(0, porTema)];
    });
    questoesSelecionadas = balanceadas.slice(0, qtd);
  }

  return {
    config: {
      tema,
      qtd,
      dificuldade,
      dataGeracao: new Date().toISOString(),
    },
    questoesSelecionadas: questoesSelecionadas.map((q) => ({
      id: q.id,
      ano: q.ano,
      tema: q.tema,
    })),
  };
}

// (C) Analisar Simulado IA
export async function analisarSimuladoIA(params: {
  detalhesPorTema: Record<string, { acertos: number; total: number }>;
  questoesErradas: string[];
}) {
  if (!openai) {
    return "Configure a OPENAI_API_KEY para usar esta funcionalidade.";
  }

  const { detalhesPorTema, questoesErradas } = params;

  const prompt = `Você é um mentor de estudos para o REVALIDA. Analise o desempenho do aluno no simulado:

**DESEMPENHO POR TEMA:**
${JSON.stringify(detalhesPorTema, null, 2)}

**TOTAL DE QUESTÕES ERRADAS:** ${questoesErradas.length}

**INSTRUÇÕES:**
1. Identifique pontos fortes (temas com >70% de acerto)
2. Identifique pontos fracos (temas com <70% de acerto)
3. Liste 3 prioridades de revisão (temas específicos)
4. Dê uma nota motivacional e estratégica para os próximos estudos

Seja objetivo, motivador e estratégico.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um mentor de estudos médicos especializado em preparação para o REVALIDA.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    return response.choices[0].message.content || "Erro ao gerar análise.";
  } catch (error) {
    console.error("Erro na IA:", error);
    return "Erro ao gerar análise. Tente novamente.";
  }
}

// Helper: embaralhar array
function embaralhar<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
