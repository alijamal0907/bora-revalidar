import { createBrowserClient } from "@supabase/ssr"

export interface SmartFlashcard {
  id: string
  frente: string
  verso: string
  materia: string
  tema: string
}

export interface SmartFlashcardContent {
  alternativa_tendenciosa: string
  comentario_explicativo: string
  modo_classico: boolean // true = mostrar apenas botão "Mostrar resposta"
}

function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ================================================
// CAMADA 1: IDENTIFICAÇÃO DO TIPO DE VERSO
// ================================================
type TipoVerso = "diagnostico" | "conduta" | "exame" | "farmacologia" | "criterio" | "lista" | "definicao"

function identificarTipoVerso(verso: string): TipoVerso {
  const versoLower = verso.toLowerCase()
  
  // LISTA: contém vírgulas com 3+ itens
  if (verso.includes(",") && verso.split(",").length >= 3) {
    return "lista"
  }
  
  // CRITÉRIO: menciona critérios, sinais, sintomas
  if (versoLower.match(/critério|sinais?|sintomas?|presença de|ausência de/)) {
    return "criterio"
  }
  
  // EXAME: menciona exames, ECG, radiografia, etc
  if (versoLower.match(/exame|ecg|eletrocardiograma|radiografia|tomografia|ecocardiograma|laboratorial/)) {
    return "exame"
  }
  
  // FARMACOLOGIA: menciona medicamentos, doses, vias
  if (versoLower.match(/mg|mcg|dose|via|betabloqueador|ieca|diurético|medicamento|droga/)) {
    return "farmacologia"
  }
  
  // CONDUTA: menciona tratamento, manejo, indicação
  if (versoLower.match(/tratamento|conduta|indicado|terapia|manejo|administrar/)) {
    return "conduta"
  }
  
  // DIAGNÓSTICO: menciona diagnóstico, define, caracteriza
  if (versoLower.match(/diagnóstico|caracterizado por|define|típico de/)) {
    return "diagnostico"
  }
  
  // Default: definição
  return "definicao"
}

// ================================================
// CAMADA 2: MODIFICAÇÃO PRINCIPAL (UMA OBRIGATÓRIA)
// ================================================
interface ModificacaoPrincipal {
  alternativa: string
  tipo: string
  aplicada: boolean
}

function aplicarModificacaoPrincipal(verso: string, tipo: TipoVerso): ModificacaoPrincipal {
  // A) TEMPO / FASE
  const modificacoesTempo: [RegExp, string, string][] = [
    [/\bagudo\b/gi, "crônico", "agudo → crônico"],
    [/\baguda\b/gi, "crônica", "aguda → crônica"],
    [/\bcrônico\b/gi, "agudo", "crônico → agudo"],
    [/\bcrônica\b/gi, "aguda", "crônica → aguda"],
    [/\bimediato\b/gi, "após estabilização", "imediato → após estabilização"],
    [/\bimediatamente\b/gi, "após estabilização", "imediatamente → após estabilização"],
    [/ap[óo]s estabiliza[çc][ãa]o/gi, "imediatamente", "após estabilização → imediatamente"],
    [/\binicial\b/gi, "tardio", "inicial → tardio"],
    [/\btardio\b/gi, "inicial", "tardio → inicial"],
    [/\bprecoce\b/gi, "tardio", "precoce → tardio"],
    [/fase aguda/gi, "fase de manutenção", "fase aguda → fase de manutenção"],
    [/fase de manutenção/gi, "fase aguda", "fase de manutenção → fase aguda"],
  ]
  
  for (const [pattern, replacement, desc] of modificacoesTempo) {
    if (pattern.test(verso)) {
      return {
        alternativa: verso.replace(pattern, replacement),
        tipo: `TEMPO/FASE: ${desc}`,
        aplicada: true
      }
    }
  }
  
  // B) PRIORIDADE / LINHA
  const modificacoesPrioridade: [RegExp, string, string][] = [
    [/primeira linha/gi, "segunda linha", "primeira → segunda linha"],
    [/segunda linha/gi, "primeira linha", "segunda → primeira linha"],
    [/exame de escolha/gi, "exame complementar", "exame de escolha → complementar"],
    [/exame complementar/gi, "exame de escolha", "exame complementar → de escolha"],
    [/tratamento de escolha/gi, "tratamento alternativo", "tratamento de escolha → alternativo"],
    [/conduta inicial/gi, "conduta de resgate", "conduta inicial → de resgate"],
    [/conduta de resgate/gi, "conduta inicial", "conduta de resgate → inicial"],
    [/droga de escolha/gi, "alternativa terapêutica", "droga de escolha → alternativa"],
  ]
  
  for (const [pattern, replacement, desc] of modificacoesPrioridade) {
    if (pattern.test(verso)) {
      return {
        alternativa: verso.replace(pattern, replacement),
        tipo: `PRIORIDADE: ${desc}`,
        aplicada: true
      }
    }
  }
  
  // C) CONTEXTO CLÍNICO
  const modificacoesContexto: [RegExp, string, string][] = [
    [/paciente inst[áa]vel/gi, "paciente estável", "paciente instável → estável"],
    [/paciente est[áa]vel/gi, "paciente instável", "paciente estável → instável"],
    [/alto risco/gi, "baixo risco", "alto risco → baixo risco"],
    [/baixo risco/gi, "alto risco", "baixo risco → alto risco"],
    [/com comorbidades/gi, "sem comorbidades", "com → sem comorbidades"],
    [/sem comorbidades/gi, "com comorbidades", "sem → com comorbidades"],
    [/hipertenso/gi, "normotenso", "hipertenso → normotenso"],
    [/normotenso/gi, "hipertenso", "normotenso → hipertenso"],
  ]
  
  for (const [pattern, replacement, desc] of modificacoesContexto) {
    if (pattern.test(verso)) {
      return {
        alternativa: verso.replace(pattern, replacement),
        tipo: `CONTEXTO: ${desc}`,
        aplicada: true
      }
    }
  }
  
  // D) MECANISMO / FUNÇÃO
  const modificacoesMecanismo: [RegExp, string, string][] = [
    [/controle de frequ[êe]ncia/gi, "controle de ritmo", "controle de frequência → ritmo"],
    [/controle de ritmo/gi, "controle de frequência", "controle de ritmo → frequência"],
    [/estabiliza[çc][ãa]o/gi, "correção definitiva", "estabilização → correção definitiva"],
    [/corre[çc][ãa]o definitiva/gi, "estabilização", "correção definitiva → estabilização"],
    [/preven[çc][ãa]o/gi, "tratamento", "prevenção → tratamento"],
    [/tratamento\b/gi, "prevenção", "tratamento → prevenção"],
  ]
  
  for (const [pattern, replacement, desc] of modificacoesMecanismo) {
    if (pattern.test(verso)) {
      return {
        alternativa: verso.replace(pattern, replacement),
        tipo: `MECANISMO: ${desc}`,
        aplicada: true
      }
    }
  }
  
  // E) FARMACOLOGIA
  const modificacoesFarmaco: [RegExp, string, string][] = [
    [/betabloqueador/gi, "bloqueador de canal de cálcio", "betabloqueador → BCC"],
    [/bloqueador.*c[áa]lcio/gi, "betabloqueador", "BCC → betabloqueador"],
    [/ieca\b/gi, "BRA", "IECA → BRA"],
    [/\bbra\b/gi, "IECA", "BRA → IECA"],
    [/dose de ataque/gi, "dose de manutenção", "ataque → manutenção"],
    [/dose de manuten[çc][ãa]o/gi, "dose de ataque", "manutenção → ataque"],
    [/via iv\b/gi, "via VO", "via IV → VO"],
    [/via vo\b/gi, "via IV", "via VO → IV"],
    [/endovenoso/gi, "via oral", "endovenoso → oral"],
    [/via oral/gi, "endovenoso", "oral → endovenoso"],
  ]
  
  for (const [pattern, replacement, desc] of modificacoesFarmaco) {
    if (pattern.test(verso)) {
      return {
        alternativa: verso.replace(pattern, replacement),
        tipo: `FARMACOLOGIA: ${desc}`,
        aplicada: true
      }
    }
  }
  
  return { alternativa: verso, tipo: "", aplicada: false }
}

// ================================================
// CAMADA 2.5: MODIFICAÇÕES NUMÉRICAS/QUANTITATIVAS (COMPLEMENTAR)
// ================================================
// Sistema que detecta e altera TODAS informações numéricas/quantitativas
// Garante pelo menos 2 modificações por texto
function aplicarModificacoesNumericas(texto: string): { 
  texto: string; 
  modificacoes: string[];
  count: number;
} {
  let resultado = texto
  const modificacoes: string[] = []
  
  // 1) NÚMEROS COM UNIDADES (mg, ml, g, UI, mcg, mmHg, bpm, etc)
  const numerosUnidades = resultado.match(/\b(\d+(?:\.\d+)?)\s*(mg|ml|g|UI|mcg|mmHg|ms|bpm|kg|L)\b/gi)
  if (numerosUnidades) {
    for (const match of numerosUnidades) {
      const valor = parseFloat(match)
      const unidade = match.replace(/[\d.]/g, '').trim()
      
      // Altera por valor próximo (±10-20%)
      const fator = valor < 10 ? 0.2 : valor < 100 ? 0.15 : 0.1
      const variacao = valor * fator
      const novoValor = Math.random() > 0.5 
        ? Math.round((valor + variacao) * 10) / 10
        : Math.max(0.1, Math.round((valor - variacao) * 10) / 10)
      
      resultado = resultado.replace(match, `${novoValor}${unidade}`)
      modificacoes.push(`DOSE: ${match} → ${novoValor}${unidade}`)
    }
  }
  
  // 2) PORCENTAGENS
  const porcentagens = resultado.match(/\b(\d+(?:\.\d+)?)\s*%/g)
  if (porcentagens) {
    for (const match of porcentagens) {
      const valor = parseFloat(match)
      const novoValor = Math.random() > 0.5 
        ? Math.min(100, valor + 5 + Math.floor(Math.random() * 10))
        : Math.max(0, valor - 5 - Math.floor(Math.random() * 10))
      
      resultado = resultado.replace(match, `${novoValor}%`)
      modificacoes.push(`%: ${match} → ${novoValor}%`)
    }
  }
  
  // 3) TEMPOS (horas, dias, semanas, meses, anos)
  const tempos = resultado.match(/\b(\d+)\s*(hora|dia|semana|m[êe]s|ano)s?\b/gi)
  if (tempos) {
    for (const match of tempos) {
      const valor = parseInt(match)
      const unidade = match.replace(/\d+/g, '').trim()
      
      // Altera tempo de forma clínica
      let novoValor: number
      if (valor <= 2) novoValor = valor === 1 ? 2 : 1
      else if (valor <= 7) novoValor = Math.random() > 0.5 ? valor + 2 : Math.max(1, valor - 2)
      else if (valor <= 30) novoValor = Math.random() > 0.5 ? valor * 2 : Math.floor(valor / 2)
      else novoValor = Math.random() > 0.5 ? valor + 10 : Math.max(1, valor - 10)
      
      resultado = resultado.replace(match, `${novoValor} ${unidade}${novoValor > 1 ? 's' : ''}`)
      modificacoes.push(`TEMPO: ${match} → ${novoValor} ${unidade}`)
    }
  }
  
  // 4) IDADES (ex: ">65 anos", "<40 anos")
  const idades = resultado.match(/([<>≥≤])\s*(\d+)\s*anos?/gi)
  if (idades) {
    for (const match of idades) {
      const valor = parseInt(match.match(/\d+/)?.[0] || '0')
      const sinal = match.match(/[<>≥≤]/)?.[0] || ''
      const novoValor = Math.random() > 0.5 ? valor + 5 : Math.max(1, valor - 5)
      
      resultado = resultado.replace(match, `${sinal}${novoValor} anos`)
      modificacoes.push(`IDADE: ${match} → ${sinal}${novoValor} anos`)
    }
  }
  
  // 5) SINAIS DE COMPARAÇÃO ISOLADOS
  if (resultado.includes('<') && !resultado.match(/[<>≥≤]\s*\d/)) {
    resultado = resultado.replace(/<(?!\d)/g, '>')
    modificacoes.push('SINAL: < → >')
  } else if (resultado.includes('>') && !resultado.match(/[<>≥≤]\s*\d/)) {
    resultado = resultado.replace(/>(?!\d)/g, '<')
    modificacoes.push('SINAL: > → <')
  }
  
  // 6) SEXO (masculino/feminino, homem/mulher)
  if (/\b(masculino|homem|homens)\b/gi.test(resultado)) {
    resultado = resultado.replace(/\bmasculino\b/gi, 'feminino')
    resultado = resultado.replace(/\bhomem\b/gi, 'mulher')
    resultado = resultado.replace(/\bhomens\b/gi, 'mulheres')
    modificacoes.push('SEXO: masculino → feminino')
  } else if (/\b(feminino|mulher|mulheres)\b/gi.test(resultado)) {
    resultado = resultado.replace(/\bfeminino\b/gi, 'masculino')
    resultado = resultado.replace(/\bmulher\b/gi, 'homem')
    resultado = resultado.replace(/\bmulheres\b/gi, 'homens')
    modificacoes.push('SEXO: feminino → masculino')
  }
  
  // 7) NÚMEROS SIMPLES (sem unidade, mas relevantes clinicamente)
  const numerosSimples = resultado.match(/\b(primeiro|segunda|terceira|quarto|quinto|1[ºª]|2[ºª]|3[ºª])\b/gi)
  if (numerosSimples) {
    const mapa: { [key: string]: string } = {
      'primeiro': 'segundo', 'segunda': 'primeira', 'terceira': 'segunda',
      'quarto': 'terceiro', 'quinto': 'quarto',
      '1º': '2º', '1ª': '2ª', '2º': '3º', '2ª': '1ª', '3ª': '2ª'
    }
    
    for (const match of numerosSimples) {
      const substituicao = mapa[match.toLowerCase()]
      if (substituicao) {
        resultado = resultado.replace(match, substituicao)
        modificacoes.push(`ORDINAL: ${match} → ${substituicao}`)
      }
    }
  }
  
  // 8) DIAS DA SEMANA
  const diasSemana = resultado.match(/\b(segunda|terça|quarta|quinta|sexta|s[áa]bado|domingo)(-feira)?\b/gi)
  if (diasSemana && diasSemana.length > 0) {
    const mapaDias: { [key: string]: string } = {
      'segunda': 'terça', 'terça': 'quarta', 'quarta': 'quinta',
      'quinta': 'sexta', 'sexta': 'sábado', 'sábado': 'domingo', 'domingo': 'segunda'
    }
    
    for (const match of diasSemana) {
      const diaBase = match.toLowerCase().replace('-feira', '').trim()
      const novoDia = mapaDias[diaBase]
      if (novoDia) {
        const temFeira = match.includes('-feira')
        const substituicao = temFeira ? `${novoDia}-feira` : novoDia
        resultado = resultado.replace(match, substituicao)
        modificacoes.push(`DIA: ${match} → ${substituicao}`)
      }
    }
  }
  
  // 9) DATAS (DD/MM/YYYY ou DD/MM)
  const datas = resultado.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g)
  if (datas && datas.length > 0) {
    for (const match of datas) {
      const partes = match.split('/')
      const dia = parseInt(partes[0])
      const mes = parseInt(partes[1])
      
      // Altera dia ou mês
      const novoDia = Math.random() > 0.5 ? Math.min(28, dia + 5) : Math.max(1, dia - 5)
      const novaData = partes.length === 3 
        ? `${novoDia.toString().padStart(2, '0')}/${partes[1]}/${partes[2]}`
        : `${novoDia.toString().padStart(2, '0')}/${partes[1]}`
      
      resultado = resultado.replace(match, novaData)
      modificacoes.push(`DATA: ${match} → ${novaData}`)
    }
  }
  
  // 10) HORÁRIOS (HH:MM ou HH:MMh)
  const horarios = resultado.match(/\b(\d{1,2}):(\d{2})h?\b/g)
  if (horarios && horarios.length > 0) {
    for (const match of horarios) {
      const [hora, minuto] = match.replace('h', '').split(':').map(n => parseInt(n))
      
      // Altera hora ±2h
      const novaHora = Math.random() > 0.5 
        ? Math.min(23, hora + 2)
        : Math.max(0, hora - 2)
      
      const novoHorario = `${novaHora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}${match.includes('h') ? 'h' : ''}`
      resultado = resultado.replace(match, novoHorario)
      modificacoes.push(`HORÁRIO: ${match} → ${novoHorario}`)
    }
  }
  
  // FORÇADOR: Garante SEMPRE pelo menos 2 modificações SEM DUPLICAÇÃO
  if (modificacoes.length < 2) {
    console.warn(`[v0] ⚠️ FORÇADOR NUMÉRICO ativado (${modificacoes.length} modificações até agora)`)
    
    // ESTRATÉGIA 1: Procura números isolados e garante variação
    const numerosIsolados = resultado.match(/\b(\d+)\b(?!\s*(mg|ml|g|UI|mcg|mmHg|ms|bpm|kg|L|hora|dia|semana|mês|ano|%))/gi)
    if (numerosIsolados && numerosIsolados.length > 0 && modificacoes.length < 2) {
      const primeiro = numerosIsolados[0]
      const valor = parseInt(primeiro)
      
      // VALIDAÇÃO: garante que o novo valor seja DIFERENTE do original
      let novoValor = valor
      let tentativas = 0
      while (novoValor === valor && tentativas < 5) {
        novoValor = Math.random() > 0.5 ? valor + (1 + tentativas) : Math.max(1, valor - (1 + tentativas))
        tentativas++
      }
      
      // Só aplica se conseguiu valor diferente
      if (novoValor !== valor) {
        resultado = resultado.replace(primeiro, novoValor.toString())
        modificacoes.push(`NÚMERO: ${primeiro} → ${novoValor}`)
        console.log(`[v0]   FORÇADOR: alterou número isolado ${primeiro} → ${novoValor}`)
      }
    }
    
    // ESTRATÉGIA 2: Substitui palavras por ANTÔNIMOS clínicos
    if (modificacoes.length < 2) {
      const antonimosClinicosForçador: [RegExp, string, string][] = [
        // Antônimos diretos de gravidade
        [/\bgrave\b/gi, "leve", "grave → leve (ANTÔNIMO)"],
        [/\bleve\b/gi, "grave", "leve → grave (ANTÔNIMO)"],
        [/\bmoderado\b/gi, "severo", "moderado → severo (ANTÔNIMO)"],
        
        // Antônimos temporais
        [/\bagudo\b/gi, "crônico", "agudo → crônico (ANTÔNIMO)"],
        [/\baguda\b/gi, "crônica", "aguda → crônica (ANTÔNIMO)"],
        [/\bcrônico\b/gi, "agudo", "crônico → agudo (ANTÔNIMO)"],
        [/\bcrônica\b/gi, "aguda", "crônica → aguda (ANTÔNIMO)"],
        [/\bprecoce\b/gi, "tardio", "precoce → tardio (ANTÔNIMO)"],
        [/\btardio\b/gi, "precoce", "tardio → precoce (ANTÔNIMO)"],
        
        // Antônimos de valores
        [/\belevado\b/gi, "reduzido", "elevado → reduzido (ANTÔNIMO)"],
        [/\belevada\b/gi, "reduzida", "elevada → reduzida (ANTÔNIMO)"],
        [/\breduzido\b/gi, "elevado", "reduzido → elevado (ANTÔNIMO)"],
        [/\breduzida\b/gi, "elevada", "reduzida → elevada (ANTÔNIMO)"],
        [/\baumentado\b/gi, "diminuído", "aumentado → diminuído (ANTÔNIMO)"],
        [/\baumentada\b/gi, "diminuída", "aumentada → diminuída (ANTÔNIMO)"],
        [/\bdiminuído\b/gi, "aumentado", "diminuído → aumentado (ANTÔNIMO)"],
        [/\bdiminuída\b/gi, "aumentada", "diminuída → aumentada (ANTÔNIMO)"],
        
        // Antônimos de presença/estabilidade
        [/\bpresente\b/gi, "ausente", "presente → ausente (ANTÔNIMO)"],
        [/\bausente\b/gi, "presente", "ausente → presente (ANTÔNIMO)"],
        [/\bestável\b/gi, "instável", "estável → instável (ANTÔNIMO)"],
        [/\binstável\b/gi, "estável", "instável → estável (ANTÔNIMO)"],
        [/\bnormal\b/gi, "alterado", "normal → alterado (ANTÔNIMO)"],
        [/\balterado\b/gi, "normal", "alterado → normal (ANTÔNIMO)"],
      ]
      
      for (const [pattern, replacement, desc] of antonimosClinicosForçador) {
        if (pattern.test(resultado) && modificacoes.length < 2) {
          resultado = resultado.replace(pattern, replacement)
          modificacoes.push(`ANTÔNIMO: ${desc}`)
          console.log(`[v0]   FORÇADOR: aplicou antônimo ${desc}`)
          break
        }
      }
    }
    
    // ESTRATÉGIA 3: Especifica conceitos temporais vagos
    if (modificacoes.length < 2) {
      const temporaisVagos: [RegExp, string, string][] = [
        [/\bpoucos dias\b/gi, "2-3 dias", "poucos dias → 2-3 dias"],
        [/\balgumas semanas\b/gi, "3-4 semanas", "algumas semanas → 3-4 semanas"],
        [/\bv[áa]rios meses\b/gi, "4-6 meses", "vários meses → 4-6 meses"],
        [/\blogo após\b/gi, "24-48h após", "logo após → 24-48h após"],
        [/\bem seguida\b/gi, "imediatamente (< 1h)", "em seguida → < 1h"],
      ]
      
      for (const [pattern, replacement, desc] of temporaisVagos) {
        if (pattern.test(resultado) && modificacoes.length < 2) {
          resultado = resultado.replace(pattern, replacement)
          modificacoes.push(`TEMPORAL: ${desc}`)
          console.log(`[v0]   FORÇADOR: especificou temporal vago`)
          break
        }
      }
    }
    
    // ESTRATÉGIA 4: Altera quantificadores
    if (modificacoes.length < 2) {
      if (/\bum\b/gi.test(resultado)) {
        resultado = resultado.replace(/\bum\b/gi, 'dois')
        modificacoes.push(`QUANTIFICADOR: um → dois`)
        console.log(`[v0]   FORÇADOR: alterou quantificador um → dois`)
      } else if (/\bdois\b/gi.test(resultado)) {
        resultado = resultado.replace(/\bdois\b/gi, 'três')
        modificacoes.push(`QUANTIFICADOR: dois → três`)
        console.log(`[v0]   FORÇADOR: alterou quantificador dois → três`)
      } else if (/\btrês\b/gi.test(resultado)) {
        resultado = resultado.replace(/\btrês\b/gi, 'quatro')
        modificacoes.push(`QUANTIFICADOR: três → quatro`)
        console.log(`[v0]   FORÇADOR: alterou quantificador três → quatro`)
      }
    }
    
    // ESTRATÉGIA 5: Modifica SINTOMAS e ELEMENTOS CLÍNICOS (antônimos/variações)
    if (modificacoes.length < 2) {
      const sintomasVariacoes: [RegExp, string, string][] = [
        // Sintomas cardiovasculares
        [/\bdispneia\b/gi, "taquipneia", "dispneia → taquipneia"],
        [/\btaquipneia\b/gi, "bradipneia", "taquipneia → bradipneia"],
        [/\btaquicardia\b/gi, "bradicardia", "taquicardia → bradicardia"],
        [/\bbradicardia\b/gi, "taquicardia", "bradicardia → taquicardia"],
        [/\bhipertensão\b/gi, "hipotensão", "hipertensão → hipotensão"],
        [/\bhipotensão\b/gi, "hipertensão", "hipotensão → hipertensão"],
        
        // Sintomas neurológicos
        [/\bconvulsão\b/gi, "tremor", "convulsão → tremor"],
        [/\btremor\b/gi, "convulsão", "tremor → convulsão"],
        [/\bconfusão mental\b/gi, "sonolência", "confusão mental → sonolência"],
        [/\bsonolência\b/gi, "agitação", "sonolência → agitação"],
        [/\bagitação\b/gi, "letargia", "agitação → letargia"],
        
        // Sintomas gerais
        [/\bfebre\b/gi, "hipotermia", "febre → hipotermia"],
        [/\bhipotermia\b/gi, "febre", "hipotermia → febre"],
        [/\bdor\b/gi, "desconforto", "dor → desconforto"],
        [/\bdesconforto\b/gi, "dor", "desconforto → dor"],
        
        // Localizações anatômicas
        [/\bdireito\b/gi, "esquerdo", "direito → esquerdo"],
        [/\besquerdo\b/gi, "direito", "esquerdo → direito"],
        [/\banterior\b/gi, "posterior", "anterior → posterior"],
        [/\bposterior\b/gi, "anterior", "posterior → anterior"],
        [/\bsuperior\b/gi, "inferior", "superior → inferior"],
        [/\binferior\b/gi, "superior", "inferior → superior"],
        
        // Achados laboratoriais
        [/\bhipoglicemia\b/gi, "hiperglicemia", "hipoglicemia → hiperglicemia"],
        [/\bhiperglicemia\b/gi, "hipoglicemia", "hiperglicemia → hipoglicemia"],
        [/\bhipocalemia\b/gi, "hipercalemia", "hipocalemia → hipercalemia"],
        [/\bhipercalemia\b/gi, "hipocalemia", "hipercalemia → hipocalemia"],
        [/\bhiponatremia\b/gi, "hipernatremia", "hiponatremia → hipernatremia"],
        [/\bhipernatremia\b/gi, "hiponatremia", "hipernatremia → hiponatremia"],
        
        // Tipos de lesão
        [/\bisquêmico\b/gi, "hemorrágico", "isquêmico → hemorrágico"],
        [/\bisquêmica\b/gi, "hemorrágica", "isquêmica → hemorrágica"],
        [/\bhemorrágico\b/gi, "isquêmico", "hemorrágico → isquêmico"],
        [/\bhemorrágica\b/gi, "isquêmica", "hemorrágica → isquêmica"],
      ]
      
      for (const [pattern, replacement, desc] of sintomasVariacoes) {
        if (pattern.test(resultado) && modificacoes.length < 2) {
          resultado = resultado.replace(pattern, replacement)
          modificacoes.push(`SINTOMA: ${desc}`)
          console.log(`[v0]   FORÇADOR: alterou sintoma/elemento ${desc}`)
          
          // Continua tentando adicionar mais uma modificação se ainda não tem 2
          if (modificacoes.length < 2) {
            continue
          } else {
            break
          }
        }
      }
    }
  }
  
  return {
    texto: resultado,
    modificacoes,
    count: modificacoes.length
  }
}

// ================================================
// CAMADA 3: MODIFICAÇÃO SECUNDÁRIA (40% de chance)
// ================================================
function aplicarModificacaoSecundaria(verso: string): { alternativa: string; aplicada: boolean } {
  // 40% de chance de aplicar modificação secundária
  if (Math.random() > 0.4) {
    return { alternativa: verso, aplicada: false }
  }
  
  const modificacoesSecundarias: [RegExp, string][] = [
    // Certeza → probabilidade
    [/[ée] indicado/gi, "pode ser considerado"],
    [/[ée] recomendado/gi, "sugere-se"],
    [/deve ser/gi, "pode ser"],
    [/define o diagn[óo]stico/gi, "sugere o diagnóstico"],
    [/confirma/gi, "sugere"],
    [/[ée] essencial/gi, "é importante"],
    [/[ée] obrigat[óo]rio/gi, "é recomendável"],
  ]
  
  for (const [pattern, replacement] of modificacoesSecundarias) {
    if (pattern.test(verso)) {
      return {
        alternativa: verso.replace(pattern, replacement),
        aplicada: true
      }
    }
  }
  
  return { alternativa: verso, aplicada: false }
}

// ================================================
// CAMADA 4: TRATAMENTO ESPECIAL PARA LISTAS
// ================================================
function modificarLista(verso: string): { alternativa: string; aplicada: boolean } {
  const items = verso.split(",").map(item => item.trim()).filter(item => item.length > 0)
  
  if (items.length < 2) {
    return { alternativa: verso, aplicada: false }
  }
  
  // Mapeamento de substituições clinicamente plausíveis mas incorretas
  const substituicoesLista: { [key: string]: string[] } = {
    // Medicamentos
    "aas": ["ticlopidina", "paracetamol"],
    "clopidogrel": ["prasugrel", "ticagrelor"],
    "heparina": ["warfarina", "rivaroxabana"],
    "enoxaparina": ["fondaparinux", "heparina"],
    "morfina": ["fentanil", "tramadol"],
    "nitrato": ["betabloqueador", "IECA"],
    "oxigenio": ["ar ambiente", "ventilação mecânica"],
    "oxigênio": ["ar ambiente", "ventilação mecânica"],
    
    // Exames
    "ecg": ["ecocardiograma", "holter"],
    "eletrocardiograma": ["ecocardiograma", "teste ergométrico"],
    "ecocardiograma": ["ECG", "angioTC"],
    "radiografia": ["ultrassonografia", "TC"],
    "tomografia": ["ressonância", "ultrassom"],
    
    // Antibióticos
    "amoxicilina": ["ampicilina", "penicilina"],
    "ceftriaxona": ["ceftazidima", "cefepime"],
    "azitromicina": ["claritromicina", "eritromicina"],
  }
  
  // Tenta substituir o primeiro item que encontrar correspondência
  for (let i = 0; i < items.length; i++) {
    const itemLower = items[i].toLowerCase()
    
    for (const [original, substitutos] of Object.entries(substituicoesLista)) {
      if (itemLower.includes(original)) {
        const substituto = substitutos[Math.floor(Math.random() * substitutos.length)]
        const novaLista = [...items]
        novaLista[i] = items[i].replace(new RegExp(original, "gi"), substituto)
        const alternativa = novaLista.join(", ")
        
        console.log(`[v0] ✓ LISTA: substituiu "${items[i]}" por "${novaLista[i]}"`)
        return { alternativa, aplicada: true }
      }
    }
  }
  
  return { alternativa: verso, aplicada: false }
}

// ================================================
// CAMADA 5: FALLBACK CLÍNICO NEUTRO
// ================================================
function aplicarFallbackClinico(verso: string): string {
  const fallbacksNeutros: [RegExp, string][] = [
    // Reduz força da indicação
    [/[ée] indicado/gi, "pode ser utilizado"],
    [/indica-se/gi, "considera-se"],
    [/devem ser/gi, "podem ser"],
    [/deve ser/gi, "pode ser"],
    [/[ée] obrigat[óo]rio/gi, "é recomendável"],
    [/[ée] essencial/gi, "é importante"],
    
    // Reduz especificidade diagnóstica
    [/diagn[óo]stico [ée] feito por/gi, "diagnóstico pode envolver"],
    [/diagn[óo]stico [ée] confirmado por/gi, "diagnóstico pode ser avaliado por"],
    
    // Reduz força de exames
    [/exame de escolha/gi, "exame utilizado na avaliação"],
    [/[ée] o exame mais/gi, "é um exame"],
    
    // Reduz força de condutas
    [/tratamento de escolha/gi, "tratamento utilizado"],
    [/conduta de escolha/gi, "conduta considerada"],
    [/[ée] necess[áa]rio/gi, "pode ser necessário"],
    
    // Reduz força de contraindicações
    [/contraindicado/gi, "não recomendado"],
    [/n[ãa]o deve ser/gi, "geralmente não é"],
  ]
  
  for (const [pattern, replacement] of fallbacksNeutros) {
    if (pattern.test(verso)) {
      console.log(`[v0] ✓ FALLBACK CLÍNICO NEUTRO aplicado`)
      return verso.replace(pattern, replacement)
    }
  }
  
  // Se nada funcionou, retorna verso original (será pulado)
  console.warn(`[v0] ⚠️ Nenhuma modificação possível - flashcard será pulado`)
  return verso
}

// ================================================
// MOTOR PRINCIPAL DE GERAÇÃO
// ================================================
export function generateLocalFallbackAlternative(verso: string): { 
  alternativa: string; 
  tipo: string; 
  modoClassico: boolean;
} {
  // CAMADA 1: Identifica tipo
  const tipoVerso = identificarTipoVerso(verso)
  console.log(`[v0] Tipo identificado: ${tipoVerso}`)
  
  let alternativaFinal = verso
  let tipoModificacao = ""
  
  // CAMADA 4: Se for LISTA, tenta modificação específica primeiro
  if (tipoVerso === "lista") {
    const resultadoLista = modificarLista(verso)
    if (resultadoLista.aplicada) {
      alternativaFinal = resultadoLista.alternativa
      tipoModificacao = "modificacao-lista"
    }
  }
  
  // CAMADA 2: Aplica modificação principal (se ainda não aplicou lista)
  if (tipoModificacao === "") {
    const modPrincipal = aplicarModificacaoPrincipal(verso, tipoVerso)
    
    if (modPrincipal.aplicada) {
      alternativaFinal = modPrincipal.alternativa
      tipoModificacao = modPrincipal.tipo
      
      // CAMADA 3: Tenta aplicar modificação secundária (40% chance)
      const modSecundaria = aplicarModificacaoSecundaria(alternativaFinal)
      
      if (modSecundaria.aplicada) {
        alternativaFinal = modSecundaria.alternativa
        tipoModificacao = `${modPrincipal.tipo} + secundária`
        console.log(`[v0] ✓ Modificação PRINCIPAL + SECUNDÁRIA aplicadas`)
      } else {
        console.log(`[v0] ✓ Modificação PRINCIPAL aplicada: ${modPrincipal.tipo}`)
      }
    } else {
      // CAMADA 5: Fallback clínico neutro
      alternativaFinal = aplicarFallbackClinico(verso)
      if (alternativaFinal !== verso) {
        tipoModificacao = "fallback-clinico-neutro"
      }
    }
  }
  
  // CAMADA 2.5 (COMPLEMENTAR): SEMPRE aplica modificações numéricas
  const resultadoNumerico = aplicarModificacoesNumericas(alternativaFinal)
  
  if (resultadoNumerico.count >= 2) {
    console.log(`[v0] ✓ COMPLEMENTAR: ${resultadoNumerico.count} modificações numéricas aplicadas:`)
    resultadoNumerico.modificacoes.forEach(mod => console.log(`[v0]   - ${mod}`))
    
    alternativaFinal = resultadoNumerico.texto
    tipoModificacao = `${tipoModificacao} + ${resultadoNumerico.count} numéricas`
  } else if (resultadoNumerico.count === 1) {
    console.log(`[v0] ⚠️ COMPLEMENTAR: apenas 1 modificação numérica (mínimo 2)`)
    console.log(`[v0]   - ${resultadoNumerico.modificacoes[0]}`)
  }
  
  // ================================================
  // VALIDAÇÃO ANTI-DUPLICAÇÃO (CRÍTICO)
  // ================================================
  // Verifica se a alternativa é REALMENTE diferente do verso
  const alternativaNormalizada = alternativaFinal.toLowerCase().trim().replace(/[.,;!?]/g, '')
  const versoNormalizado = verso.toLowerCase().trim().replace(/[.,;!?]/g, '')
  
  const isDuplicada = alternativaNormalizada === versoNormalizado
  const isMuitoSimilar = alternativaNormalizada.length > 10 && 
    (alternativaNormalizada.includes(versoNormalizado) || versoNormalizado.includes(alternativaNormalizada))
  
  if (isDuplicada || isMuitoSimilar) {
    console.warn(`[v0] 🛡️ VALIDAÇÃO: Alternativa duplicada/similar detectada`)
    console.warn(`[v0]    Verso: "${verso.substring(0, 60)}..."`)
    console.warn(`[v0]    Alt: "${alternativaFinal.substring(0, 60)}..."`)
    console.warn(`[v0]    ✓ Ativando MODO CLÁSSICO (fallback de UX)`)
    
    return {
      alternativa: verso, // Mantém verso original
      tipo: "modo-classico-ativado",
      modoClassico: true // Flag para UI usar modo clássico
    }
  }
  
  // Se aplicou alguma modificação clínica válida e diferente
  if (tipoModificacao !== "" && alternativaFinal !== verso) {
    console.log(`[v0] ✓ Alternativa VÁLIDA gerada (modo inteligente)`)
    return {
      alternativa: alternativaFinal,
      tipo: tipoModificacao,
      modoClassico: false
    }
  }
  
  // Se NADA funcionou, ativa modo clássico (NUNCA pula flashcard)
  console.warn(`[v0] 🛡️ Nenhuma modificação válida possível`)
  console.warn(`[v0]    ✓ Ativando MODO CLÁSSICO (fallback de UX)`)
  
  return {
    alternativa: verso,
    tipo: "modo-classico-ativado",
    modoClassico: true
  }
}

// ================================================
// GERAÇÃO DE CONTEÚDO INTELIGENTE
// ================================================
export async function generateSmartContent(flashcard: SmartFlashcard): Promise<SmartFlashcardContent> {
  try {
    const { alternativa, tipo, modoClassico } = generateLocalFallbackAlternative(flashcard.verso)
    
    // Se modo clássico ativado, retorna com flag
    if (modoClassico) {
      console.log(`[v0] ✓ Flashcard em MODO CLÁSSICO (sem alternativa)`)
      return {
        alternativa_tendenciosa: flashcard.verso,
        comentario_explicativo: "",
        modo_classico: true
      }
    }
    
    // Modo inteligente: gera comentário explicativo detalhado
    const comentario = gerarComentarioDetalhado(flashcard.verso, alternativa, tipo)
    
    return {
      alternativa_tendenciosa: alternativa,
      comentario_explicativo: comentario,
      modo_classico: false
    }
  } catch (error) {
    console.error("[v0] Erro ao gerar conteúdo:", error)
    // Em caso de erro, usa modo clássico (nunca retorna null)
    return {
      alternativa_tendenciosa: flashcard.verso,
      comentario_explicativo: "",
      modo_classico: true
    }
  }
}

// ================================================
// GERAÇÃO DE COMENTÁRIO EXPLICATIVO DETALHADO
// ================================================
function gerarComentarioDetalhado(verso: string, alternativa: string, tipo: string): string {
  // Identifica as diferenças específicas entre verso e alternativa
  const versoLower = verso.toLowerCase()
  const alternativaLower = alternativa.toLowerCase()
  
  // EXPLICA DIFERENÇA BASEADA NO TIPO DE MODIFICAÇÃO
  if (tipo.includes("TEMPO/FASE")) {
    // Identifica qual tempo foi trocado
    if (tipo.includes("agudo → crônica")) {
      return `❌ ERRO: A alternativa menciona "crônica", mas o correto é "agudo". Lembre-se: agudo = início súbito e curta duração; crônico = longa duração (geralmente >3-6 meses).`
    }
    if (tipo.includes("crônica → aguda")) {
      return `❌ ERRO: A alternativa menciona "aguda", mas o correto é "crônica". Lembre-se: crônico = longa duração (geralmente >3-6 meses); agudo = início súbito e curta duração.`
    }
    if (tipo.includes("imediato → após estabilização") || tipo.includes("imediatamente → após estabilização")) {
      return `❌ ERRO: A alternativa menciona "após estabilização", mas o correto é conduta "imediata". Em emergências, tempo é crucial e a intervenção não pode esperar.`
    }
    if (tipo.includes("após estabilização → imediatamente")) {
      return `❌ ERRO: A alternativa menciona "imediatamente", mas o correto é "após estabilização". A conduta deve aguardar estabilização do quadro antes de ser realizada.`
    }
    if (tipo.includes("precoce → tardio")) {
      return `❌ ERRO: A alternativa menciona "tardio", mas o correto é "precoce". Complicações precoces ocorrem logo após o evento (horas a dias); tardias ocorrem após semanas a meses.`
    }
    if (tipo.includes("tardio → inicial")) {
      return `❌ ERRO: A alternativa menciona "inicial", mas o correto é "tardio". Eventos tardios ocorrem após semanas a meses do evento inicial.`
    }
    return `❌ ERRO: A alternativa altera o momento/fase do conceito clínico. Verifique o VERSO CORRETO e observe a diferença temporal mencionada.`
  }
  
  if (tipo.includes("PRIORIDADE/LINHA")) {
    if (tipo.includes("primeira linha → segunda linha")) {
      return `❌ ERRO: A alternativa menciona "segunda linha", mas o correto é "primeira linha". Primeira linha = tratamento preferencial inicial; segunda linha = usado se primeira falhar.`
    }
    if (tipo.includes("segunda linha → primeira linha")) {
      return `❌ ERRO: A alternativa menciona "primeira linha", mas o correto é "segunda linha". Segunda linha é usada quando primeira linha falha ou é contraindicada.`
    }
    if (tipo.includes("escolha → confirmatório")) {
      return `❌ ERRO: A alternativa troca exame de "escolha" (preferencial/inicial) por "confirmatório" (usado para confirmar diagnóstico). Não são intercambiáveis.`
    }
    if (tipo.includes("confirmatório → escolha")) {
      return `❌ ERRO: A alternativa troca exame "confirmatório" por "de escolha". Exame de escolha = preferencial para investigação inicial; confirmatório = usado para validar diagnóstico.`
    }
    return `❌ ERRO: A alternativa altera a prioridade/linha terapêutica. Verifique qual é a conduta ou exame PRIORITÁRIO conforme diretrizes.`
  }
  
  if (tipo.includes("CONTEXTO")) {
    if (tipo.includes("alto risco → baixo risco")) {
      return `❌ ERRO: A alternativa menciona "baixo risco", mas o contexto correto é "alto risco". Estratificação de risco determina intensidade do tratamento.`
    }
    if (tipo.includes("baixo risco → alto risco")) {
      return `❌ ERRO: A alternativa menciona "alto risco", mas o contexto correto é "baixo risco". Pacientes de baixo risco não necessitam abordagem agressiva.`
    }
    if (tipo.includes("estável → instável")) {
      return `❌ ERRO: A alternativa menciona paciente "instável", mas o correto é "estável". Estabilidade hemodinâmica determina urgência e tipo de conduta.`
    }
    if (tipo.includes("instável → estável")) {
      return `❌ ERRO: A alternativa menciona paciente "estável", mas o correto é "instável". Pacientes instáveis necessitam intervenção imediata e agressiva.`
    }
    return `❌ ERRO: A alternativa altera o contexto clínico (gravidade, risco, estabilidade). O contexto do paciente DEFINE a conduta correta.`
  }
  
  if (tipo.includes("MECANISMO")) {
    if (tipo.includes("prevenção → tratamento")) {
      return `❌ ERRO: A alternativa menciona "tratamento", mas o objetivo correto é "prevenção". Prevenção = evitar doença/complicação; tratamento = corrigir doença existente.`
    }
    if (tipo.includes("tratamento → prevenção")) {
      return `❌ ERRO: A alternativa menciona "prevenção", mas o objetivo correto é "tratamento". Tratamento atua em doença já instalada; prevenção visa evitar sua ocorrência.`
    }
    return `❌ ERRO: A alternativa altera o mecanismo ou objetivo terapêutico. Identifique se a conduta visa prevenir, tratar, diagnosticar ou acompanhar.`
  }
  
  if (tipo.includes("FARMACOLOGIA")) {
    if (tipo.includes("betabloqueador → BCC")) {
      return `❌ ERRO: A alternativa substitui "betabloqueador" por "bloqueador de canal de cálcio (BCC)". São classes diferentes com indicações e mecanismos distintos.`
    }
    if (tipo.includes("BCC → betabloqueador")) {
      return `❌ ERRO: A alternativa substitui "BCC (bloqueador de canal de cálcio)" por "betabloqueador". São classes farmacológicas diferentes com perfis de indicação distintos.`
    }
    if (tipo.includes("IECA → BRA")) {
      return `❌ ERRO: A alternativa substitui "IECA" por "BRA". Ambos atuam no sistema renina-angiotensina mas são classes diferentes: IECA bloqueia ECA; BRA bloqueia receptor AT1.`
    }
    if (tipo.includes("ataque → manutenção")) {
      return `❌ ERRO: A alternativa menciona dose de "manutenção", mas o correto é dose de "ataque". Dose de ataque = maior dose inicial para atingir nível terapêutico rapidamente.`
    }
    if (tipo.includes("manutenção → ataque")) {
      return `❌ ERRO: A alternativa menciona dose de "ataque", mas o correto é dose de "manutenção". Dose de manutenção = dose regular após atingir nível terapêutico.`
    }
    if (tipo.includes("IV → VO")) {
      return `❌ ERRO: A alternativa substitui via "intravenosa (IV)" por "via oral (VO)". Via de administração afeta biodisponibilidade e tempo de ação.`
    }
    if (tipo.includes("VO → IV")) {
      return `❌ ERRO: A alternativa substitui via "oral (VO)" por "intravenosa (IV)". Em emergências, via IV garante ação mais rápida e previsível.`
    }
    return `❌ ERRO: A alternativa altera informação farmacológica (classe, dose, via, frequência). Revise o conceito farmacológico correto.`
  }
  
  if (tipo === "modificacao-lista") {
    // Tenta identificar qual item foi substituído
    const versoItems = verso.split(",").map(s => s.trim())
    const altItems = alternativa.split(",").map(s => s.trim())
    
    for (let i = 0; i < Math.min(versoItems.length, altItems.length); i++) {
      if (versoItems[i].toLowerCase() !== altItems[i].toLowerCase()) {
        return `❌ ERRO NA LISTA: O item "${altItems[i]}" está INCORRETO. O correto é "${versoItems[i]}". Todos os outros itens da lista estão corretos.`
      }
    }
    
    return `❌ ERRO: Um dos elementos da lista foi substituído por outro clinicamente próximo mas INCORRETO. Compare cada item com atenção.`
  }
  
  // Fallback genérico
  return `❌ ERRO: A alternativa apresenta diferença sutil em relação ao VERSO CORRETO. Compare ambos cuidadosamente e identifique a alteração conceitual.`
}

// ================================================
// ATUALIZA STATUS DE APRENDIZADO
// ================================================
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
    // Ignora erros silenciosamente
  }
}
