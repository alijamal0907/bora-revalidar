import { createClient } from '@/lib/supabase/client'
import { findSubtopicForModule, getQuestionsForSubtopic, getFlashcardsForSubtopic } from '@/lib/subtopic-search'

// Semanas do plano com seus subtemas para cada área
export const STUDY_PLAN_STRUCTURE = {
  week1: {
    title: 'Fundamentos Clínicos e Cirúrgicos',
    topics: {
      'Clínica Médica': ['Semiotecnia', 'Avaliação Clínica Geral'],
      'Cirurgia': ['Avaliação Pré-operatória', 'Técnica Cirúrgica Básica'],
      'Pediatria': ['Avaliação da Criança', 'Desenvolvimento Normal'],
      'Ginecologia e Obstetrícia': ['Exame Ginecológico', 'Fisiologia Reprodutiva'],
      'Medicina Preventiva': ['Epidemiologia Básica', 'Conceitos em Saúde Pública'],
    },
  },
  week2: {
    title: 'Cardiologia e Respiratório',
    topics: {
      'Clínica Médica': ['Cardiologia Básica', 'Doenças Cardiovasculares'],
      'Cirurgia': ['Emergências Cardíacas', 'Cirurgia Cardíaca'],
      'Pediatria': ['Cardiopatias Congênitas', 'Problemas Respiratórios'],
      'Ginecologia e Obstetrícia': ['Complicações Cardiovasculares na Gestação', 'Embolia Pulmonar'],
      'Medicina Preventiva': ['Prevenção de Doenças Cardiovasculares', 'Programas de Rastreamento'],
    },
  },
  week3: {
    title: 'Gastrointestinal e Hepatologia',
    topics: {
      'Clínica Médica': ['Doenças Gastrointestinais', 'Hepatologia'],
      'Cirurgia': ['Cirurgia Abdominal', 'Emergências Abdominais'],
      'Pediatria': ['Gastroenterologia Pediátrica', 'Doenças Hepáticas'],
      'Ginecologia e Obstetrícia': ['Complicações GI na Gestação', 'Hepatopatias Gestacionais'],
      'Medicina Preventiva': ['Prevenção de Câncer Gastrointestinal', 'Screening Hepático'],
    },
  },
  week4: {
    title: 'Neurologia e Psiquiatria',
    topics: {
      'Clínica Médica': ['Doenças Neurológicas', 'Transtornos Psiquiátricos'],
      'Cirurgia': ['Neurocirurgia Básica', 'Emergências Neurológicas'],
      'Pediatria': ['Neurologia Pediátrica', 'Transtornos do Neurodesenvolvimento'],
      'Ginecologia e Obstetrícia': ['Eclampsia e Pré-eclampsia', 'Psiquiatria Perinatal'],
      'Medicina Preventiva': ['Prevenção de Acidentes Cerebrovasculares', 'Saúde Mental Pública'],
    },
  },
  week5: {
    title: 'Endocrinologia e Metabolismo',
    topics: {
      'Clínica Médica': ['Diabetes Mellitus', 'Doenças da Tireoide'],
      'Cirurgia': ['Cirurgia Endócrina', 'Emergências Endócrinas'],
      'Pediatria': ['Diabetes Tipo 1', 'Transtornos do Crescimento'],
      'Ginecologia e Obstetrícia': ['Diabetes Gestacional', 'Alterações Endócrinas na Gestação'],
      'Medicina Preventiva': ['Programas de Prevenção do Diabetes', 'Educação em Saúde Endócrina'],
    },
  },
  week6: {
    title: 'Nefrologia e Urologia',
    topics: {
      'Clínica Médica': ['Insuficiência Renal', 'Doenças Glomerulares'],
      'Cirurgia': ['Cirurgia Urológica', 'Urologia de Emergência'],
      'Pediatria': ['Insuficiência Renal Pediátrica', 'Malformações Urinárias'],
      'Ginecologia e Obstetrícia': ['Pré-eclampsia', 'Infecções Urinárias na Gestação'],
      'Medicina Preventiva': ['Prevenção de Doença Renal Crônica', 'Rastreamento Urológico'],
    },
  },
  week7: {
    title: 'Hematologia e Oncologia',
    topics: {
      'Clínica Médica': ['Anemias', 'Leucemias e Linfomas'],
      'Cirurgia': ['Cirurgia Oncológica', 'Ressecção de Tumores'],
      'Pediatria': ['Leucemias Pediátricas', 'Tumores Sólidos'],
      'Ginecologia e Obstetrícia': ['Câncer Ginecológico', 'Quimioterapia na Gestação'],
      'Medicina Preventiva': ['Rastreamento do Câncer', 'Programas Oncológicos'],
    },
  },
  week8: {
    title: 'Doenças Infecciosas',
    topics: {
      'Clínica Médica': ['Infecções Bacterianas', 'Infecções Virais', 'Parasitoses'],
      'Cirurgia': ['Infecção de Feridas', 'Sepse e Choque Séptico'],
      'Pediatria': ['Infecções Pediátricas', 'Vacinação'],
      'Ginecologia e Obstetrícia': ['Infecções Maternas', 'Doenças Congênitas'],
      'Medicina Preventiva': ['Epidemiologia de Doenças Infecciosas', 'Programas de Controle'],
    },
  },
  week9: {
    title: 'Ortopedia e Traumatologia',
    topics: {
      'Clínica Médica': ['Doenças Reumatológicas', 'Osteoporose'],
      'Cirurgia': ['Trauma e Emergências Ortopédicas', 'Fraturas'],
      'Pediatria': ['Traumatologia Pediátrica', 'Doenças Ósseas Pediátricas'],
      'Ginecologia e Obstetrícia': ['Trauma em Gestantes', 'Alterações Ósseas na Gestação'],
      'Medicina Preventiva': ['Prevenção de Acidentes', 'Promoção de Saúde Óssea'],
    },
  },
  week10: {
    title: 'Dermatologia e Alergologia',
    topics: {
      'Clínica Médica': ['Doenças de Pele', 'Alergias'],
      'Cirurgia': ['Procedimentos Dermatológicos', 'Reconstrução de Pele'],
      'Pediatria': ['Dermatologia Pediátrica', 'Alergias Pediátricas'],
      'Ginecologia e Obstetrícia': ['Alterações de Pele na Gestação', 'Doenças Alérgicas'],
      'Medicina Preventiva': ['Prevenção do Câncer de Pele', 'Orientações Alérgicas'],
    },
  },
  week11: {
    title: 'Otorrinolaringologia e Oftalmologia',
    topics: {
      'Clínica Médica': ['Doenças ORL', 'Oftalmologia Básica'],
      'Cirurgia': ['Cirurgia ORL', 'Procedimentos Oftalmológicos'],
      'Pediatria': ['ORL Pediátrica', 'Oftalmologia Pediátrica'],
      'Ginecologia e Obstetrícia': ['Complicações ORL na Gestação', 'Alterações Visuais'],
      'Medicina Preventiva': ['Prevenção de Perda Auditiva', 'Rastreamento Visual'],
    },
  },
  week12: {
    title: 'Ginecologia Clínica',
    topics: {
      'Clínica Médica': ['Saúde da Mulher', 'Climatério'],
      'Cirurgia': ['Cirurgia Ginecológica', 'Laparoscopia'],
      'Pediatria': ['Ginecologia Pediátrica', 'Puberdade'],
      'Ginecologia e Obstetrícia': ['Distúrbios Menstruais', 'Contracepção', 'Infertilidade'],
      'Medicina Preventiva': ['Prevenção de Câncer Cervical', 'Programas de Saúde Reprodutiva'],
    },
  },
  week13: {
    title: 'Obstetrícia - Gestação Normal',
    topics: {
      'Clínica Médica': ['Adaptações Fisiológicas', 'Suporte Pré-natal'],
      'Cirurgia': ['Emergências Obstétricas Iniciais', 'Cirurgia em Gestantes'],
      'Pediatria': ['Crescimento Intrauterino', 'Fatores Fetais'],
      'Ginecologia e Obstetrícia': ['Pré-natal Normal', 'Diagnóstico de Gestação', 'Crescimento Fetal'],
      'Medicina Preventiva': ['Cuidados Preventivos Pré-natais', 'Educação Maternal'],
    },
  },
  week14: {
    title: 'Obstetrícia - Complicações Maternas',
    topics: {
      'Clínica Médica': ['Doenças na Gestação', 'Manejo de Comorbidades'],
      'Cirurgia': ['Cirurgia em Gestantes de Risco', 'Emergências Cirúrgicas'],
      'Pediatria': ['Fatores Maternos Adversos', 'Complicações Fetais'],
      'Ginecologia e Obstetrícia': ['Pré-eclampsia', 'Diabetes Gestacional', 'Infecções Gestacionais'],
      'Medicina Preventiva': ['Prevenção de Complicações', 'Rastreamento de Risco'],
    },
  },
  week15: {
    title: 'Obstetrícia - Complicações Fetais e Neonatologia',
    topics: {
      'Clínica Médica': ['Complicações Fetais', 'Orientação Neonatal'],
      'Cirurgia': ['Feto em Risco', 'Emergências Neonatais'],
      'Pediatria': ['Complicações Neonatais', 'Reanimação Neonatal'],
      'Ginecologia e Obstetrícia': ['Sofrimento Fetal', 'Restrição de Crescimento', 'Prematuridade'],
      'Medicina Preventiva': ['Prevenção de Óbito Fetal', 'Programas de Cuidado Neonatal'],
    },
  },
  week16: {
    title: 'Parto e Puerpério',
    topics: {
      'Clínica Médica': ['Suporte no Parto', 'Complicações Puerperais'],
      'Cirurgia': ['Cesárea', 'Complicações Cirúrgicas', 'Lacerações'],
      'Pediatria': ['Assistência ao Recém-nascido', 'Amamentação'],
      'Ginecologia e Obstetrícia': ['Parto Normal e Operatório', 'Condução do Trabalho de Parto'],
      'Medicina Preventiva': ['Prevenção de Infecções Puerperais', 'Planejamento Familiar'],
    },
  },
  week17: {
    title: 'Revisão Integrada - Parte 1',
    topics: {
      'Clínica Médica': ['Casos Clínicos Integrados 1', 'Manejo Multidisciplinar'],
      'Cirurgia': ['Integração com Clínica', 'Decisões Cirúrgicas'],
      'Pediatria': ['Casos Pediátricos Integrados', 'Sistematização'],
      'Ginecologia e Obstetrícia': ['Casos GO Integrados', 'Tomada de Decisão'],
      'Medicina Preventiva': ['Programas Integrados', 'Organização de Sistemas'],
    },
  },
  week18: {
    title: 'Revisão Integrada - Parte 2',
    topics: {
      'Clínica Médica': ['Casos Clínicos Integrados 2', 'Protocolos Clínicos'],
      'Cirurgia': ['Técnicas Avançadas', 'Complicações'],
      'Pediatria': ['Manejo de Emergências', 'Urgências Pediátricas'],
      'Ginecologia e Obstetrícia': ['Emergências Obstétricas', 'Protocolo de Atendimento'],
      'Medicina Preventiva': ['Vigilância Epidemiológica', 'Resposta a Surtos'],
    },
  },
  week19: {
    title: 'Simulados e Prova Prática',
    topics: {
      'Clínica Médica': ['Simulado 1', 'Análise de Erros'],
      'Cirurgia': ['Simulado 1', 'Técnicas em Prática'],
      'Pediatria': ['Simulado 1', 'Discussão de Casos'],
      'Ginecologia e Obstetrícia': ['Simulado 1', 'Discussão Obstétrica'],
      'Medicina Preventiva': ['Simulado 1', 'Análise Epidemiológica'],
    },
  },
  week20: {
    title: 'Revisão Final e Preparação',
    topics: {
      'Clínica Médica': ['Revisão Final', 'Tópicos Críticos'],
      'Cirurgia': ['Revisão Final', 'Decisões Importantes'],
      'Pediatria': ['Revisão Final', 'Últimas Atualizações'],
      'Ginecologia e Obstetrícia': ['Revisão Final', 'Tópicos Essenciais'],
      'Medicina Preventiva': ['Revisão Final', 'Conceitos-chave'],
    },
  },
}

// Inicializar plano de estudo para um usuário
export async function initializeUserStudyPlan(userId: string) {
    const supabase = createClient()

  try {
    // Verificar se o plano já foi inicializado
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (existingProgress && existingProgress.length > 0) {
      console.log('[v0] Plano de estudo já inicializado para usuário:', userId)
      return true
    }

    // Preparar dados para inserção
    const progressData: any[] = []

    Object.entries(STUDY_PLAN_STRUCTURE).forEach((entry) => {
      const weekKey = entry[0]
      const weekNum = parseInt(weekKey.replace('week', ''))
      const weekData = entry[1] as any

      Object.entries(weekData.topics).forEach((topicEntry) => {
        const areaName = topicEntry[0]
        const subtopics = topicEntry[1] as string[]

        // Usar primeiro subtema ou combinação
        const subtopic = subtopics[0] || areaName

        progressData.push({
          user_id: userId,
          week_number: weekNum,
          area_name: areaName,
          subtopic_name: subtopic,
          status_completed: false,
        })
      })
    })

    // Inserir dados
    const { error: insertError } = await supabase
      .from('user_progress')
      .insert(progressData)

    if (insertError) {
      console.error('[v0] Erro ao inicializar plano de estudo:', insertError)
      return false
    }

    console.log('[v0] Plano de estudo inicializado com sucesso para:', userId)
    return true
  } catch (error) {
    console.error('[v0] Erro em initializeUserStudyPlan:', error)
    return false
  }
}

// Buscar questões relacionadas a um subtema
export async function getQuestionsForModule(
  areaName: string,
  subtopicName: string,
  limit: number = 5
): Promise<any[]> {
    const supabase = createClient()

  try {
    // Buscar questões por tema/subtema
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .or(`tema.ilike.${areaName}%,subtema.ilike.${subtopicName}%`)
      .limit(limit)

    if (error) {
      console.error('[v0] Erro ao buscar questões:', error)
      return []
    }

    if (questions && questions.length > 0) {
      return questions
    }

    // Fallback: buscar por tema se nenhuma questão foi encontrada
    const { data: fallbackQuestions } = await supabase
      .from('questions')
      .select('*')
      .ilike('tema', `${areaName}%`)
      .limit(limit)

    return fallbackQuestions || []
  } catch (error) {
    console.error('[v0] Erro em getQuestionsForModule:', error)
    return []
  }
}

// Buscar flashcards relacionados a um subtema
export async function getFlashcardsForModule(
  areaName: string,
  subtopicName: string,
  limit: number = 5
): Promise<any[]> {
    const supabase = createClient()

  try {
    // Buscar flashcards por materia/tema
    const { data: flashcards, error } = await supabase
      .from('flashcards')
      .select('*')
      .or(`materia.ilike.${areaName}%,tema.ilike.${subtopicName}%`)
      .limit(limit)

    if (error) {
      console.error('[v0] Erro ao buscar flashcards:', error)
      return []
    }

    if (flashcards && flashcards.length > 0) {
      return flashcards
    }

    // Fallback: buscar por materia
    const { data: fallbackFlashcards } = await supabase
      .from('flashcards')
      .select('*')
      .ilike('materia', `${areaName}%`)
      .limit(limit)

    return fallbackFlashcards || []
  } catch (error) {
    console.error('[v0] Erro em getFlashcardsForModule:', error)
    return []
  }
}
