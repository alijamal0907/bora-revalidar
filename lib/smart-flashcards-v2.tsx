import { createClient } from "@/lib/supabase/client"

function getSupabaseClient() {
  return createClient()
}

interface ModificacaoDetectadaComNivel {
  tipo: string
  original: string
  modificado: string
  nivel: "hard" | "medio" | "basico"
}

export interface SmartFlashcard {
  id: string
  materia: string
  tema: string
  frente: string
  verso: string
  alternativa_tendenciosa: string | null
  comentario_explicativo: string | null
  created_at: string
  updated_at: string
}

// ================================================
// TEMPLATES CLÍNICOS PUROS - SEM FORÇADORES
// ================================================
export function generateLocalFallbackAlternative(verso: string): {
  alternativa: string
  modificacao: ModificacaoDetectadaComNivel
} {
  // TEMPLATE 1: CONDUTA – PRIMEIRA vs SEGUNDA LINHA
  const primeiraSegundaLinha: [RegExp, string][] = [
    [/primeira\s+linha/gi, "segunda linha"],
    [/segunda\s+linha/gi, "primeira linha"],
    [/tratamento\s+inicial/gi, "tratamento de resgate"],
    [/tratamento\s+de\s+resgate/gi, "tratamento inicial"],
    [/(conduta|terapia|tratamento)\s+de\s+escolha/gi, "$1 alternativo"],
    [/(conduta|terapia|tratamento)\s+alternativ[ao]/gi, "$1 de escolha"],
  ]

  for (const [pattern, replacement] of primeiraSegundaLinha) {
    if (pattern.test(verso)) {
      const alternativa = verso.replace(pattern, replacement)
      return {
        alternativa,
        modificacao: {
          tipo: "linha-terapeutica",
          original: "conforme verso",
          modificado: "linha alterada",
          nivel: "hard",
        },
      }
    }
  }

  // TEMPLATE 2: CONDUTA – IMEDIATO vs APÓS ESTABILIZAÇÃO
  const timingClinico: [RegExp, string][] = [
    [/\bimediata(mente)?\b/gi, "após estabilização"],
    [/ap[oó]s\s+estabiliza[cç][aã]o/gi, "imediatamente"],
    [/\bprecoce\b/gi, "tardio"],
    [/\btardio\b/gi, "precoce"],
    [/nas\s+primeiras\s+horas/gi, "após 24-48h"],
    [/ap[oó]s\s+24[-–]48h/gi, "nas primeiras horas"],
  ]

  for (const [pattern, replacement] of timingClinico) {
    if (pattern.test(verso)) {
      const alternativa = verso.replace(pattern, replacement)
      return {
        alternativa,
        modificacao: {
          tipo: "timing-clinico",
          original: "conforme verso",
          modificado: "timing alterado",
          nivel: "hard",
        },
      }
    }
  }

  // TEMPLATE 3: EXAME – ESCOLHA vs CONFIRMATÓRIO
  const tipoExame: [RegExp, string][] = [
    [/exame\s+de\s+escolha/gi, "exame confirmatório"],
    [/exame\s+confirmat[oó]rio/gi, "exame de escolha"],
    [/exame\s+inicial/gi, "exame complementar"],
    [/exame\s+complementar/gi, "exame inicial"],
  ]

  for (const [pattern, replacement] of tipoExame) {
    if (pattern.test(verso)) {
      const alternativa = verso.replace(pattern, replacement)
      return {
        alternativa,
        modificacao: {
          tipo: "tipo-exame",
          original: "conforme verso",
          modificado: "tipo alterado",
          nivel: "hard",
        },
      }
    }
  }

  // TEMPLATE 4: EXAME – SENSÍVEL vs ESPECÍFICO
  const sensivelEspecifico: [RegExp, string][] = [
    [/mais\s+sens[ií]vel/gi, "mais específico"],
    [/mais\s+espec[ií]fico/gi, "mais sensível"],
  ]

  for (const [pattern, replacement] of sensivelEspecifico) {
    if (pattern.test(verso)) {
      const alternativa = verso.replace(pattern, replacement)
      return {
        alternativa,
        modificacao: {
          tipo: "sensibilidade-especificidade",
          original: "conforme verso",
          modificado: "característica alterada",
          nivel: "hard",
        },
      }
    }
  }

  // TEMPLATE 5: DOSE – ATAQUE vs MANUTENÇÃO
  const doseAtaqueManutencao: [RegExp, string][] = [
    [/dose\s+de\s+ataque/gi, "dose de manutenção"],
    [/dose\s+de\s+manuten[cç][aã]o/gi, "dose de ataque"],
  ]

  for (const [pattern, replacement] of doseAtaqueManutencao) {
    if (pattern.test(verso)) {
      const alternativa = verso.replace(pattern, replacement)
      return {
        alternativa,
        modificacao: {
          tipo: "tipo-dose",
          original: "conforme verso",
          modificado: "tipo de dose alterado",
          nivel: "hard",
        },
      }
    }
  }

  // TEMPLATE 6: VIA – ENDOVENOSA vs ORAL
  const viaAdministracao: [RegExp, string][] = [
    [/\b(via\s+)?intravenosa\b/gi, "via oral"],
    [/\b(via\s+)?oral\b/gi, "via intravenosa"],
    [/\bVO\b/g, "IV"],
    [/\bIV\b/g, "VO"],
  ]

  for (const [pattern, replacement] of viaAdministracao) {
    if (pattern.test(verso)) {
      const alternativa = verso.replace(pattern, replacement)
      return {
        alternativa,
        modificacao: {
          tipo: "via-administracao",
          original: "conforme verso",
          modificado: "via alterada",
          nivel: "hard",
        },
      }
    }
  }

  // TEMPLATE 7: DIAGNÓSTICO – PRESENÇA vs AUSÊNCIA
  const presencaAusencia: [RegExp, string][] = [
    [/\bpresen[cç]a\b/gi, "ausência"],
    [/\baus[eê]ncia\b/gi, "presença"],
    [/\bpositivo\b/gi, "negativo"],
    [/\bnegativo\b/gi, "positivo"],
    [/\belevado\b/gi, "reduzido"],
    [/\breduzido\b/gi, "elevado"],
  ]

  for (const [pattern, replacement] of presencaAusencia) {
    if (pattern.test(verso)) {
      const alternativa = verso.replace(pattern, replacement)
      return {
        alternativa,
        modificacao: {
          tipo: "presenca-ausencia",
          original: "conforme verso",
          modificado: "característica invertida",
          nivel: "hard",
        },
      }
    }
  }

  // TEMPLATE 8: CONTEXTO CLÍNICO – INSTÁVEL vs ESTÁVEL
  const estabilidadePaciente: [RegExp, string][] = [
    [/paciente\s+inst[aá]vel/gi, "paciente estável"],
    [/paciente\s+est[aá]vel/gi, "paciente instável"],
  ]

  for (const [pattern, replacement] of estabilidadePaciente) {
    if (pattern.test(verso)) {
      const alternativa = verso.replace(pattern, replacement)
      return {
        alternativa,
        modificacao: {
          tipo: "estabilidade-clinica",
          original: "conforme verso",
          modificado: "estabilidade alterada",
          nivel: "hard",
        },
      }
    }
  }

  // TEMPLATE 9: SEQUÊNCIA – ANTES vs DEPOIS
  const sequenciaTemporal: [RegExp, string][] = [
    [/\bantes\s+de\b/gi, "após"],
    [/\bap[oó]s\b/gi, "antes de"],
  ]

  for (const [pattern, replacement] of sequenciaTemporal) {
    if (pattern.test(verso)) {
      const alternativa = verso.replace(pattern, replacement)
      return {
        alternativa,
        modificacao: {
          tipo: "sequencia-temporal",
          original: "conforme verso",
          modificado: "sequência alterada",
          nivel: "hard",
        },
      }
    }
  }

  // TEMPLATE 10: LISTAS – TROCA DE UM ITEM (mantém formato e número)
  if (verso.includes(",")) {
    const items = verso.split(",").map(item => item.trim()).filter(item => item.length > 0)
    
    if (items.length >= 3) {
      // Mapeamento clínico para substituições plausíveis
      const substituicoesLista: { [key: string]: string } = {
        // Complicações cardiovasculares
        "choque cardiogênico": "hipoglicemia",
        "choque cardiogenico": "hipoglicemia",
        "insuficiência cardíaca": "pneumonia",
        "insuficiencia cardíaca": "pneumonia",
        "arritmias": "anemia",
        
        // Medicamentos
        "AAS": "dipirona",
        "clopidogrel": "prasugrel",
        "heparina": "warfarina",
        "morfina": "tramadol",
        "oxigênio": "ventilação mecânica",
        "oxigenio": "ventilação mecânica",
        "nitrato": "betabloqueador",
        
        // Exames
        "ECG": "ecocardiograma",
        "radiografia": "ultrassonografia",
        "tomografia": "ressonância magnética",
      }

      // Tenta substituir cada item
      for (let i = 0; i < items.length; i++) {
        const itemLower = items[i].toLowerCase()
        
        for (const [original, substituto] of Object.entries(substituicoesLista)) {
          if (itemLower.includes(original.toLowerCase())) {
            const novaLista = [...items]
            novaLista[i] = items[i].replace(new RegExp(original, "gi"), substituto)
            const alternativa = novaLista.join(", ")
            
            console.log(`[v0] ✓ LISTA: substituiu "${items[i]}" por "${novaLista[i]}"`)
            return {
              alternativa,
              modificacao: {
                tipo: "lista-item-substituido",
                original: items[i],
                modificado: novaLista[i],
                nivel: "hard",
              },
            }
          }
        }
      }
    }
  }

  // ================================================
  // TEMPLATE CLÍNICO NEUTRO (FALLBACK FINAL OBRIGATÓRIO)
  // ================================================
  // Reduz força das afirmações mantendo estrutura e domínio clínico
  console.warn(`[v0] 🛡️ Template clínico neutro ativado para: "${verso.substring(0, 60)}..."`)
  
  const templateNeutro: [RegExp, string][] = [
    // Reduz força da indicação
    [/\b[ée]\s+indicado\b/gi, "pode ser utilizado"],
    [/\bindica-se\b/gi, "considera-se"],
    [/\bdevem\s+ser\b/gi, "podem ser"],
    [/\bdeve\s+ser\b/gi, "pode ser"],
    [/\b[ée]\s+obrigat[oó]rio\b/gi, "é recomendável"],
    [/\b[ée]\s+essencial\b/gi, "é importante"],
    
    // Reduz especificidade diagnóstica
    [/diagn[oó]stico\s+[ée]\s+feito\s+por/gi, "diagnóstico pode envolver"],
    [/diagn[oó]stico\s+[ée]\s+confirmado\s+por/gi, "diagnóstico pode ser avaliado por"],
    
    // Reduz força de exames
    [/exame\s+de\s+escolha/gi, "exame utilizado na avaliação"],
    [/\b[ée]\s+o\s+exame\s+mais\b/gi, "é um exame"],
    
    // Reduz força de condutas
    [/tratamento\s+de\s+escolha/gi, "tratamento utilizado"],
    [/conduta\s+de\s+escolha/gi, "conduta considerada"],
    [/\b[ée]\s+necess[aá]rio\b/gi, "pode ser necessário"],
    
    // Reduz força de contraindicações
    [/\bcontraindicado\b/gi, "não recomendado"],
    [/\bn[aã]o\s+deve\s+ser\b/gi, "geralmente não é"],
  ]
  
  for (const [pattern, replacement] of templateNeutro) {
    if (pattern.test(verso)) {
      const alternativa = verso.replace(pattern, replacement)
      console.log(`[v0] ✓ TEMPLATE NEUTRO aplicado: reduziu força da afirmação`)
      return {
        alternativa,
        modificacao: {
          tipo: "template-neutro",
          original: "afirmação categórica",
          modificado: "afirmação atenuada",
          nivel: "medio",
        },
      }
    }
  }
  
  // ================================================
  // SUBSTITUIÇÕES DISCRETAS MÚLTIPLAS (FALLBACK FINAL)
  // ================================================
  // Aplica PELO MENOS 2 modificações na mesma frase para máxima confusão
  console.warn(`[v0] 🔄 Substituições discretas múltiplas ativadas`)
  
  let alternativa = verso
  const modificacoesAplicadas: string[] = []
  
  // MODIFICAÇÃO 1: Altera TODOS os números/doses encontrados
  const numerosMatch = alternativa.match(/\b(\d+)\s*(mg|ml|g|UI|mcg|mmHg|ms|bpm|%)/gi)
  if (numerosMatch && numerosMatch.length > 0) {
    for (const numeroOriginal of numerosMatch) {
      const valor = Number.parseInt(numeroOriginal)
      const unidade = numeroOriginal.replace(/\d+/g, "").trim()
      
      // Altera por valor clinicamente próximo mas incorreto
      const fator = valor < 10 ? 1 : valor < 50 ? 5 : valor < 100 ? 10 : 20
      const novoValor = Math.random() > 0.5 ? valor + fator : Math.max(1, valor - fator)
      
      alternativa = alternativa.replace(numeroOriginal, `${novoValor}${unidade}`)
      modificacoesAplicadas.push(`${numeroOriginal} → ${novoValor}${unidade}`)
    }
  }
  
  // MODIFICAÇÃO 2: Altera TODOS os tempos encontrados
  const temposMatch = alternativa.match(/\b(\d+)\s*(hora|dia|semana|mês|meses|h|min|minuto)s?\b/gi)
  if (temposMatch && temposMatch.length > 0) {
    for (const tempoOriginal of temposMatch) {
      const valor = Number.parseInt(tempoOriginal)
      const unidade = tempoOriginal.replace(/\d+/g, "").trim()
      
      // Altera de forma sutil (±1 para valores pequenos, dobra/metade para grandes)
      let novoValor: number
      if (valor <= 3) {
        novoValor = valor === 1 ? 2 : valor - 1
      } else if (valor <= 12) {
        novoValor = Math.random() > 0.5 ? valor + 2 : Math.max(1, valor - 2)
      } else {
        novoValor = Math.random() > 0.5 ? valor * 2 : Math.max(1, Math.floor(valor / 2))
      }
      
      alternativa = alternativa.replace(tempoOriginal, `${novoValor} ${unidade}`)
      modificacoesAplicadas.push(`${tempoOriginal} → ${novoValor} ${unidade}`)
    }
  }
  
  // MODIFICAÇÃO 3: Inverte TODOS os sinais de comparação
  if (alternativa.includes("<") || alternativa.includes(">") || alternativa.includes("≥") || alternativa.includes("≤")) {
    const sinaisOriginais: string[] = []
    
    if (alternativa.includes("<")) {
      sinaisOriginais.push("<")
      alternativa = alternativa.replace(/</g, ">")
    }
    if (alternativa.includes(">")) {
      sinaisOriginais.push(">")
      alternativa = alternativa.replace(/>/g, "<")
    }
    if (alternativa.includes("≥")) {
      sinaisOriginais.push("≥")
      alternativa = alternativa.replace(/≥/g, "≤")
    }
    if (alternativa.includes("≤")) {
      sinaisOriginais.push("≤")
      alternativa = alternativa.replace(/≤/g, "≥")
    }
    
    if (sinaisOriginais.length > 0) {
      modificacoesAplicadas.push(`Sinais invertidos: ${sinaisOriginais.join(", ")}`)
    }
  }
  
  // MODIFICAÇÃO 4: Altera ordinais (primeira/segunda/terceira)
  const ordinaisMatch = alternativa.match(/\b(primeira|segundo|segunda|terceira|quarta|quinto)\b/gi)
  if (ordinaisMatch && ordinaisMatch.length > 0) {
    const ordinaisMap: { [key: string]: string } = {
      "primeira": "segunda",
      "segundo": "terceiro", 
      "segunda": "primeira",
      "terceira": "segunda",
      "quarta": "terceira",
      "quinto": "quarto",
    }
    
    for (const ordinalOriginal of ordinaisMatch) {
      const novoOrdinal = ordinaisMap[ordinalOriginal.toLowerCase()]
      if (novoOrdinal) {
        alternativa = alternativa.replace(ordinalOriginal, novoOrdinal)
        modificacoesAplicadas.push(`${ordinalOriginal} → ${novoOrdinal}`)
      }
    }
  }
  
  // MODIFICAÇÃO 5: Altera quantificadores (múltiplos/poucos/muitos)
  const quantificadoresMap: [RegExp, string][] = [
    [/\bmúltiplos\b/gi, "poucos"],
    [/\bpoucos\b/gi, "múltiplos"],
    [/\bmuitos\b/gi, "alguns"],
    [/\balguns\b/gi, "muitos"],
    [/\btodos\b/gi, "a maioria"],
    [/\ba maioria\b/gi, "alguns"],
  ]
  
  for (const [pattern, replacement] of quantificadoresMap) {
    if (pattern.test(alternativa)) {
      const match = alternativa.match(pattern)
      if (match) {
        alternativa = alternativa.replace(pattern, replacement)
        modificacoesAplicadas.push(`${match[0]} → ${replacement}`)
        break
      }
    }
  }
  
  // MODIFICAÇÃO 6: Substitui termo clínico similar (se houver)
  const substituicoesTermos: [RegExp, string][] = [
    [/\bprimeiro\b/gi, "principal"],
    [/\bprincipal\b/gi, "primeiro"],
    [/\bmaior\b/gi, "mais comum"],
    [/\belevada\b/gi, "aumentada"],
    [/\baguda\b/gi, "grave"],
    [/\bcrônica\b/gi, "persistente"],
    [/\binicial\b/gi, "primária"],
    [/\bessencial\b/gi, "fundamental"],
    [/\bespecífico\b/gi, "característico"],
    [/\bprecoce\b/gi, "inicial"],
    [/\btardio\b/gi, "posterior"],
  ]
  
  for (const [pattern, replacement] of substituicoesTermos) {
    if (pattern.test(alternativa)) {
      const match = alternativa.match(pattern)
      if (match) {
        alternativa = alternativa.replace(pattern, replacement)
        modificacoesAplicadas.push(`${match[0]} → ${replacement}`)
        break
      }
    }
  }
  
  // FORÇADOR AGRESSIVO: Garante SEMPRE pelo menos 2 modificações
  if (modificacoesAplicadas.length < 2) {
    console.warn(`[v0] ⚠️ Forçando 2+ modificações (atual: ${modificacoesAplicadas.length})`)
    
    // Tenta substituições de termos clínicos adicionais
    const substituicoesExtras: [RegExp, string][] = [
      [/\bprimeiro\b/gi, "principal"],
      [/\bmaior\b/gi, "mais frequente"],
      [/\belevada\b/gi, "aumentada"],
      [/\baguda\b/gi, "súbita"],
      [/\bcrônica\b/gi, "prolongada"],
      [/\binicial\b/gi, "primária"],
      [/\bessencial\b/gi, "importante"],
      [/\bprecoce\b/gi, "antecipado"],
      [/\btardio\b/gi, "posterior"],
      [/\bimediato\b/gi, "urgente"],
    ]
    
    for (const [pattern, replacement] of substituicoesExtras) {
      if (modificacoesAplicadas.length >= 2) break
      
      if (pattern.test(alternativa)) {
        const match = alternativa.match(pattern)
        if (match) {
          alternativa = alternativa.replace(pattern, replacement)
          modificacoesAplicadas.push(`${match[0]} → ${replacement}`)
        }
      }
    }
    
    // Se ainda não tem 2, adiciona modificações criativas
    if (modificacoesAplicadas.length < 2) {
      // Substitui conectivos (e/ou)
      if (alternativa.includes(" e ")) {
        alternativa = alternativa.replace(/ e /, " ou ")
        modificacoesAplicadas.push("e → ou")
      } else if (alternativa.includes(" ou ")) {
        alternativa = alternativa.replace(/ ou /, " e ")
        modificacoesAplicadas.push("ou → e")
      }
    }
    
    // Se ainda não tem 2, substitui verbos
    if (modificacoesAplicadas.length < 2) {
      const verbosMap: [RegExp, string][] = [
        [/\b[ée] indicado\b/gi, "pode ser considerado"],
        [/\b[ée] recomendado\b/gi, "é sugerido"],
        [/\bdeve ser\b/gi, "pode ser"],
        [/\b[ée] feito\b/gi, "é realizado"],
      ]
      
      for (const [pattern, replacement] of verbosMap) {
        if (modificacoesAplicadas.length >= 2) break
        
        if (pattern.test(alternativa)) {
          const match = alternativa.match(pattern)
          if (match) {
            alternativa = alternativa.replace(pattern, replacement)
            modificacoesAplicadas.push(`${match[0]} → ${replacement}`)
          }
        }
      }
    }
  }
  
  // Se aplicou pelo menos 1 modificação, retorna
  if (modificacoesAplicadas.length > 0 && alternativa !== verso) {
    console.log(`[v0] ✓ Múltiplas modificações aplicadas (${modificacoesAplicadas.length}):`)
    modificacoesAplicadas.forEach(mod => console.log(`[v0]   - ${mod}`))
    
    return {
      alternativa,
      modificacao: {
        tipo: "multiplas-alteracoes",
        original: "verso original",
        modificado: `${modificacoesAplicadas.length} alterações aplicadas`,
        nivel: "hard",
      },
    }
  }
  
  // PRIORIDADE 2: Substituições de termos clínicos similares
  const substituicoesImperceptiveis: [RegExp, string, string][] = [
    [/\bprimeiro\b/gi, "principal", "primeiro → principal"],
    [/\bprincipal\b/gi, "primeiro", "principal → primeiro"],
    [/\bmaior\b/gi, "mais comum", "maior → mais comum"],
    [/\bmais\s+comum\b/gi, "maior", "mais comum → maior"],
    [/\belevada\b/gi, "aumentada", "elevada → aumentada"],
    [/\baumentada\b/gi, "elevada", "aumentada → elevada"],
    [/\breduzida\b/gi, "diminuída", "reduzida → diminuída"],
    [/\bdiminuída\b/gi, "reduzida", "diminuída → reduzida"],
    [/\baguda\b/gi, "grave", "aguda → grave"],
    [/\bgrave\b/gi, "aguda", "grave → aguda"],
    [/\bcrônica\b/gi, "persistente", "crônica → persistente"],
    [/\bpersistente\b/gi, "crônica", "persistente → crônica"],
    [/\binicial\b/gi, "primária", "inicial → primária"],
    [/\bprimária\b/gi, "inicial", "primária → inicial"],
    [/\bsecundária\b/gi, "subsequente", "secundária → subsequente"],
    [/\bsubsequente\b/gi, "secundária", "subsequente → secundária"],
    [/\bessencial\b/gi, "fundamental", "essencial → fundamental"],
    [/\bfundamental\b/gi, "essencial", "fundamental → essencial"],
    [/\bespecífico\b/gi, "característico", "específico → característico"],
    [/\bcaracterístico\b/gi, "específico", "característico → específico"],
    [/\btípico\b/gi, "habitual", "típico → habitual"],
    [/\bhabitual\b/gi, "típico", "habitual → típico"],
    [/\bprecoce\b/gi, "inicial", "precoce → inicial"],
    [/\btardio\b/gi, "posterior", "tardio → posterior"],
    [/\bposterior\b/gi, "tardio", "posterior → tardio"],
    [/\banterior\b/gi, "prévio", "anterior → prévio"],
    [/\bprévio\b/gi, "anterior", "prévio → anterior"],
    [/\bintermediário\b/gi, "moderado", "intermediário → moderado"],
    [/\bmoderado\b/gi, "intermediário", "moderado → intermediário"],
  ]
  
  for (const [pattern, replacement, description] of substituicoesImperceptiveis) {
    if (pattern.test(verso)) {
      const alternativa = verso.replace(pattern, replacement)
      if (alternativa !== verso) {
        console.log(`[v0] ✓ Substituição discreta: ${description}`)
        return {
          alternativa,
          modificacao: {
            tipo: "substituicao-discreta",
            original: description.split(" → ")[0],
            modificado: description.split(" → ")[1],
            nivel: "hard",
          },
        }
      }
    }
  }
  
  // ÚLTIMO RECURSO: Adiciona advérbio temporal discreto
  console.warn(`[v0] ⚠️ Último recurso: adicionando advérbio temporal`)
  const comAdverbio = verso.replace(/^([A-Z])/, "Geralmente, $1".toLowerCase())
  
  return {
    alternativa: comAdverbio.charAt(0).toUpperCase() + comAdverbio.slice(1),
    modificacao: {
      tipo: "adverbio-temporal",
      original: "afirmação categórica",
      modificado: "afirmação generalizada",
      nivel: "basico",
    },
  }
}

// Gera comentário explicativo
function generateTemplateComment(
  versoCorreto: string,
  alternativaErrada: string,
  modificacao: ModificacaoDetectadaComNivel
): string {
  const explicacoes: Record<string, string> = {
    "linha-terapeutica": "A linha terapêutica é fundamental. Essa alternativa inverte a hierarquia do tratamento.",
    "timing-clinico": "O timing da intervenção é decisivo. Essa alternativa erra no momento da conduta.",
    "tipo-exame": "A classificação do exame é importante. Essa alternativa confunde exame de escolha com confirmatório.",
    "sensibilidade-especificidade": "Sensibilidade e especificidade são conceitos distintos. Essa alternativa inverte esses parâmetros.",
    "tipo-dose": "O tipo de dose determina o esquema. Essa alternativa confunde dose de ataque com manutenção.",
    "via-administracao": "A via de administração afeta biodisponibilidade. Essa alternativa usa via inadequada.",
    "presenca-ausencia": "A presença ou ausência do achado muda o diagnóstico. Essa alternativa inverte esse critério.",
    "estabilidade-clinica": "A estabilidade do paciente define a urgência. Essa alternativa erra nesse contexto.",
    "sequencia-temporal": "A sequência dos procedimentos é protocolar. Essa alternativa inverte a ordem.",
    "lista-item-substituido": "Um dos itens da lista foi substituído incorretamente. Essa alternativa parece plausível mas contém erro.",
  }

  const explicacao = explicacoes[modificacao.tipo] || "Essa alternativa contém erro clínico sutil."
  
  return `Essa alternativa parece correta mas contém um erro importante. ${explicacao} A resposta correta permanece: ${versoCorreto}`
}

// Gera conteúdo para um flashcard
export async function generateSmartContent(flashcard: SmartFlashcard): Promise<{
  alternativa_tendenciosa: string
  comentario_explicativo: string
}> {
  const resultado = generateLocalFallbackAlternative(flashcard.verso)
  
  const comentario_explicativo = generateTemplateComment(
    flashcard.verso,
    resultado.alternativa,
    resultado.modificacao
  )
  
  return {
    alternativa_tendenciosa: resultado.alternativa,
    comentario_explicativo,
  }
}

// Funções de banco de dados (mantidas do original)
export async function getSmartFlashcards(
  userId: string,
  materia?: string,
  tema?: string,
  limit: number = 40
): Promise<SmartFlashcard[]> {
  const supabase = getSupabaseClient()

  let query = supabase
    .from("flashcards")
    .select("*")
    .eq("is_global", true)

  if (materia) {
    query = query.eq("materia", materia)
  }
  if (tema) {
    query = query.eq("tema", tema)
  }

  const { data: flashcards, error } = await query.limit(limit * 2)

  if (error || !flashcards || flashcards.length === 0) {
    return []
  }

  // Embaralha
  const shuffled = flashcards.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, limit)
}

export async function saveSmartFlashcardAnswer(
  userId: string,
  flashcardId: string,
  correct: boolean,
  materia: string,
  tema: string,
  totalInteractions: number
): Promise<void> {
  const supabase = getSupabaseClient()

  await supabase.from("flashcard_history").insert({
    user_id: userId,
    flashcard_id: flashcardId,
    materia,
    tema,
    correct,
    answered_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  })
}

// Atualiza status de aprendizado
export async function updateLearningStatus(
  userId: string,
  flashcardId: string,
  correct: boolean,
  currentInteractionCount: number
): Promise<void> {
  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  try {
    const { data: existingStatus } = await supabase
      .from("flashcard_learning_status")
      .select("*")
      .eq("user_id", userId)
      .eq("flashcard_id", flashcardId)
      .single()

    if (!existingStatus) {
      // Cria novo registro
      await supabase.from("flashcard_learning_status").insert({
        user_id: userId,
        flashcard_id: flashcardId,
        status: correct ? "consolidado" : "errou",
        wrong_count: correct ? 0 : 1,
        correct_count: correct ? 1 : 0,
        last_wrong_at: correct ? null : now,
        last_correct_at: correct ? now : null,
      })
    } else {
      // Atualiza registro existente
      const newStatus = correct && existingStatus.status === "errou" ? "consolidado" : existingStatus.status
      await supabase
        .from("flashcard_learning_status")
        .update({
          status: newStatus,
          wrong_count: correct ? existingStatus.wrong_count : existingStatus.wrong_count + 1,
          correct_count: correct ? existingStatus.correct_count + 1 : existingStatus.correct_count,
          last_wrong_at: correct ? existingStatus.last_wrong_at : now,
          last_correct_at: correct ? now : existingStatus.last_correct_at,
          updated_at: now,
        })
        .eq("id", existingStatus.id)
    }
  } catch (e) {
    // Ignora erros silenciosamente (tabela pode não existir)
  }
}
