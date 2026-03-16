'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, CheckCircle, Lock, BookOpen, Brain, AlertCircle } from 'lucide-react'
import Link from 'next/link'

// Títulos das semanas
const WEEK_TITLES: Record<number, string> = {
  1: 'Fundamentos Clínicos e Cirúrgicos',
  2: 'Cardiologia e Cirurgia Cardíaca',
  3: 'Pneumologia e Cirurgia Torácica',
  4: 'Gastroenterologia e Cirurgia do Abdome',
  5: 'Nefrologia e Urologia',
  6: 'Neurologia e Neurocirurgia',
  7: 'Endocrinologia e Cirurgia Endócrina',
  8: 'Oncologia e Oncologia Cirúrgica',
  9: 'Hematologia e Transplantes',
  10: 'Infectologia e Cirurgia de Urgência',
  11: 'Reumatologia e Ortopedia',
  12: 'Dermatologia e Cirurgia Plástica',
  13: 'Saúde da Mulher e Ginecologia',
  14: 'Obstetrícia e Alto Risco Gestacional',
  15: 'Pediatria – Neonatologia e Lactente',
  16: 'Pediatria – Crescimento e Doenças Crônicas',
  17: 'Medicina Preventiva e Saúde Coletiva',
  18: 'Urgência, Emergência e Trauma',
  19: 'Revisão Multidisciplinar I',
  20: 'Revisão Multidisciplinar II',
}

// Conteúdo de cada semana por área
const AREAS_MEDICAS = [
  'Clínica Médica',
  'Clínica Cirúrgica',
  'Pediatria',
  'Ginecologia e Obstetrícia',
  'Medicina Preventiva',
]

const WEEKS_CONTENT: Record<number, Record<string, string>> = {
  1: {
    'Clínica Médica': 'Semiologia e Propedêutica',
    'Clínica Cirúrgica': 'Princípios de Cirurgia e Anestesia',
    Pediatria: 'Crescimento e Desenvolvimento Normal',
    'Ginecologia e Obstetrícia': 'Ciclo Menstrual e Ginecologia Básica',
    'Medicina Preventiva': 'Epidemiologia e Bioestatística',
  },
  2: {
    'Clínica Médica': 'Cardiologia – HAS, IC, Arritmias',
    'Clínica Cirúrgica': 'Cirurgia Cardíaca e Vascular',
    Pediatria: 'Cardiopatias Congênitas',
    'Ginecologia e Obstetrícia': 'Pré-Natal e Assistência ao Parto',
    'Medicina Preventiva': 'Vigilância Epidemiológica',
  },
  3: {
    'Clínica Médica': 'Pneumologia – Asma, DPOC, Pneumonias',
    'Clínica Cirúrgica': 'Cirurgia Torácica',
    Pediatria: 'Doenças Respiratórias na Infância',
    'Ginecologia e Obstetrícia': 'Complicações Obstétricas',
    'Medicina Preventiva': 'Doenças Respiratórias – Prevenção',
  },
  4: {
    'Clínica Médica': 'Gastroenterologia – DII, Hepatites, Cirrose',
    'Clínica Cirúrgica': 'Cirurgia Abdominal – Abdome Agudo',
    Pediatria: 'Diarreia e Desidratação',
    'Ginecologia e Obstetrícia': 'Infecções Ginecológicas',
    'Medicina Preventiva': 'Saneamento e Saúde Ambiental',
  },
  5: {
    'Clínica Médica': 'Nefrologia – IRA, DRC, Glomerulopatias',
    'Clínica Cirúrgica': 'Urologia – Litíase, Câncer, ITU',
    Pediatria: 'Doenças Renais na Infância',
    'Ginecologia e Obstetrícia': 'Patologias Mamárias',
    'Medicina Preventiva': 'Saúde da Criança – Programas',
  },
  6: {
    'Clínica Médica': 'Neurologia – AVC, Epilepsia, Demências',
    'Clínica Cirúrgica': 'Neurocirurgia – TCE, Tumores',
    Pediatria: 'Neurologia Pediátrica',
    'Ginecologia e Obstetrícia': 'Oncologia Ginecológica',
    'Medicina Preventiva': 'Saúde Mental – Prevenção',
  },
  7: {
    'Clínica Médica': 'Endocrinologia – DM, Tireoide, Adrenal',
    'Clínica Cirúrgica': 'Cirurgia Endócrina',
    Pediatria: 'Endocrinopatias Pediátricas',
    'Ginecologia e Obstetrícia': 'Endocrinologia Reprodutiva',
    'Medicina Preventiva': 'Doenças Crônicas – Prevenção',
  },
  8: {
    'Clínica Médica': 'Oncologia – Princípios e Tumores Sólidos',
    'Clínica Cirúrgica': 'Oncologia Cirúrgica',
    Pediatria: 'Oncologia Pediátrica',
    'Ginecologia e Obstetrícia': 'Gestação de Alto Risco',
    'Medicina Preventiva': 'Rastreamento e Prevenção de Câncer',
  },
  9: {
    'Clínica Médica': 'Hematologia – Anemias, Leucemias, Linfomas',
    'Clínica Cirúrgica': 'Transplantes de Órgãos',
    Pediatria: 'Hematologia Pediátrica',
    'Ginecologia e Obstetrícia': 'Hemorragias Obstétricas',
    'Medicina Preventiva': 'Hemoterapia e Banco de Sangue',
  },
  10: {
    'Clínica Médica': 'Infectologia – HIV, Tuberculose, Dengue',
    'Clínica Cirúrgica': 'Cirurgia de Urgência e Trauma',
    Pediatria: 'Doenças Infectocontagiosas na Infância',
    'Ginecologia e Obstetrícia': 'Infecções na Gestação – TORCH',
    'Medicina Preventiva': 'Controle de Vetores e Zoonoses',
  },
  11: {
    'Clínica Médica': 'Reumatologia – LES, AR, Espondiloartrites',
    'Clínica Cirúrgica': 'Ortopedia e Traumatologia',
    Pediatria: 'Reumatologia Pediátrica',
    'Ginecologia e Obstetrícia': 'Uroginecologia',
    'Medicina Preventiva': 'Saúde do Trabalhador',
  },
  12: {
    'Clínica Médica': 'Dermatologia – Eczemas, Psoríase, Melanoma',
    'Clínica Cirúrgica': 'Cirurgia Plástica e Reparadora',
    Pediatria: 'Dermatologia Pediátrica',
    'Ginecologia e Obstetrícia': 'Anticoncepção',
    'Medicina Preventiva': 'Dermatoses Profissionais',
  },
  13: {
    'Clínica Médica': 'Medicina Interna – Revisão Sistêmica',
    'Clínica Cirúrgica': 'Cirurgia Minimamente Invasiva',
    Pediatria: 'Imunizações e Saúde do Adolescente',
    'Ginecologia e Obstetrícia': 'Climatério e Menopausa',
    'Medicina Preventiva': 'Saúde da Mulher – Programas',
  },
  14: {
    'Clínica Médica': 'Doenças do Colágeno e Vasculites',
    'Clínica Cirúrgica': 'Hérnias e Parede Abdominal',
    Pediatria: 'Neonatologia Avançada',
    'Ginecologia e Obstetrícia': 'Parto de Alto Risco',
    'Medicina Preventiva': 'Atenção Pré-Natal',
  },
  15: {
    'Clínica Médica': 'Medicina de Urgência – Sepse, Choque',
    'Clínica Cirúrgica': 'Trauma – ATLS e Politrauma',
    Pediatria: 'Urgências Pediátricas',
    'Ginecologia e Obstetrícia': 'Emergências Obstétricas',
    'Medicina Preventiva': 'Primeiros Socorros e SAMU',
  },
  16: {
    'Clínica Médica': 'Geriatria e Cuidados Paliativos',
    'Clínica Cirúrgica': 'Cirurgia Geral – Revisão',
    Pediatria: 'Adolescência e Medicina do Adolescente',
    'Ginecologia e Obstetrícia': 'Reprodução Assistida',
    'Medicina Preventiva': 'Saúde do Idoso – Programas',
  },
  17: {
    'Clínica Médica': 'Medicina Baseada em Evidências',
    'Clínica Cirúrgica': 'Pós-Operatório e Complicações',
    Pediatria: 'Nutrição Infantil e Aleitamento',
    'Ginecologia e Obstetrícia': 'Doenças Sexualmente Transmissíveis',
    'Medicina Preventiva': 'Atenção Básica – PSF e PACS',
  },
  18: {
    'Clínica Médica': 'Toxicologia e Intoxicações',
    'Clínica Cirúrgica': 'Queimaduras e Lesões por Calor',
    Pediatria: 'Intoxicações Exógenas na Infância',
    'Ginecologia e Obstetrícia': 'Violência Sexual e Acolhimento',
    'Medicina Preventiva': 'Urgência e Emergência – SUS',
  },
  19: {
    'Clínica Médica': 'Revisão – Clínica Médica e Neurologia',
    'Clínica Cirúrgica': 'Revisão – Cirurgia e Trauma',
    Pediatria: 'Revisão – Pediatria Geral',
    'Ginecologia e Obstetrícia': 'Revisão – GO e Obstetrícia',
    'Medicina Preventiva': 'Revisão – Medicina Preventiva',
  },
  20: {
    'Clínica Médica': 'Simulado Final – Clínica Médica',
    'Clínica Cirúrgica': 'Simulado Final – Cirurgia',
    Pediatria: 'Simulado Final – Pediatria',
    'Ginecologia e Obstetrícia': 'Simulado Final – GO',
    'Medicina Preventiva': 'Simulado Final – Preventiva',
  },
}

interface ModuleRow {
  id: string
  user_id: string
  week_number: number
  area_name: string
  subtopic_name: string
  status_completed: boolean
  completed_at: string | null
}

interface WeekData {
  week: number
  title: string
  modules: ModuleRow[]
  completedInWeek: number
  isLocked: boolean
  isCurrent: boolean
  isCompleted: boolean
}

// Inicializa o plano diretamente via Supabase client (sem import de gamification.ts)
async function initPlanIfNeeded(userId: string) {
  const supabase = createClient()
  const { data: existing } = await supabase
    .from('user_progress')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (existing && existing.length > 0) return

  const records = []
  for (let week = 1; week <= 20; week++) {
    for (const area of AREAS_MEDICAS) {
      records.push({
        user_id: userId,
        week_number: week,
        area_name: area,
        subtopic_name: WEEKS_CONTENT[week]?.[area] ?? `${area} – Semana ${week}`,
        status_completed: false,
        completed_at: null,
      })
    }
  }
  await supabase.from('user_progress').insert(records)
}

export default function StudyPlanPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [progress, setProgress] = useState<ModuleRow[]>([])
  const [currentWeek, setCurrentWeek] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [completedCount, setCompletedCount] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/login')
          return
        }
        setUser(authUser)

        await initPlanIfNeeded(authUser.id)

        const { data: rows } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', authUser.id)
          .order('week_number', { ascending: true })

        const userProgress: ModuleRow[] = rows ?? []
        setProgress(userProgress)

        const completed = userProgress.filter((p) => p.status_completed).length
        setCompletedCount(completed)

        // Calcular semana atual
        const weekCounts: Record<number, number> = {}
        for (const p of userProgress) {
          if (p.status_completed) {
            weekCounts[p.week_number] = (weekCounts[p.week_number] ?? 0) + 1
          }
        }
        let week = 1
        for (let w = 1; w <= 20; w++) {
          if ((weekCounts[w] ?? 0) >= 5) week = w + 1
          else { week = w; break }
        }
        setCurrentWeek(Math.min(week, 20))
      } catch (err) {
        console.error('[studyplan] Erro:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [router])

  const handleCompleteModule = async (week: number, area: string) => {
    if (!user) return
    const supabase = createClient()
    await supabase
      .from('user_progress')
      .update({ status_completed: true, completed_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('week_number', week)
      .eq('area_name', area)

    setProgress((prev) =>
      prev.map((p) =>
        p.week_number === week && p.area_name === area
          ? { ...p, status_completed: true, completed_at: new Date().toISOString() }
          : p,
      ),
    )
    setCompletedCount((prev) => prev + 1)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
        <Navbar user={user} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300">Carregando plano de estudo...</p>
          </div>
        </div>
      </div>
    )
  }

  const totalModules = 100
  const progressPercentage = Math.round((completedCount / totalModules) * 100)

  const weeksData: WeekData[] = Array.from({ length: 20 }, (_, i) => {
    const week = i + 1
    const modules = progress.filter((p) => p.week_number === week)
    const completedInWeek = modules.filter((p) => p.status_completed).length
    return {
      week,
      title: WEEK_TITLES[week] || `Semana ${week}`,
      modules,
      completedInWeek,
      isLocked: week > currentWeek + 1,
      isCurrent: week === currentWeek,
      isCompleted: completedInWeek >= 5,
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      <Navbar user={user} />

      <main className="mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            Plano de Estudos – 20 Semanas
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Trilha estruturada com 5 módulos por semana
          </p>
        </div>

        {/* Progresso Geral */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Semana Atual: {currentWeek}/20</h2>
              <p className="text-sm text-slate-400 mt-1">{completedCount} de {totalModules} módulos completos</p>
            </div>
            <div className="text-3xl font-bold text-emerald-400">{progressPercentage}%</div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Timeline de Semanas */}
        <div className="space-y-4 sm:space-y-6">
          {weeksData.map((weekData) => (
            <div
              key={weekData.week}
              className={`border rounded-xl overflow-hidden transition-all ${
                weekData.isCompleted
                  ? 'border-emerald-500/50 bg-emerald-900/20'
                  : weekData.isCurrent
                    ? 'border-blue-500/50 bg-blue-900/20'
                    : weekData.isLocked
                      ? 'border-slate-700 bg-slate-800/30 opacity-70'
                      : 'border-slate-700 bg-slate-800/50'
              }`}
            >
              {/* Header da Semana */}
              <div className="bg-slate-800/50 p-4 sm:p-6 border-b border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        weekData.isCompleted
                          ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500'
                          : weekData.isCurrent
                            ? 'bg-blue-500/30 text-blue-400 border border-blue-500'
                            : weekData.isLocked
                              ? 'bg-slate-700 text-slate-500 border border-slate-600'
                              : 'bg-slate-700 text-slate-400 border border-slate-600'
                      }`}
                    >
                      {weekData.isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : weekData.isLocked ? (
                        <Lock className="w-5 h-5" />
                      ) : (
                        `S${weekData.week}`
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Semana {weekData.week}</h3>
                      <p className="text-sm text-slate-400">{weekData.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{weekData.completedInWeek}/5 módulos completos</p>
                    </div>
                  </div>

                  {weekData.isCompleted && (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
                      Completo
                    </span>
                  )}
                  {weekData.isCurrent && !weekData.isCompleted && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
                      Em Progresso
                    </span>
                  )}
                  {weekData.isLocked && (
                    <span className="px-3 py-1 bg-slate-700 text-slate-400 text-xs font-semibold rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Bloqueada
                    </span>
                  )}
                </div>
              </div>

              {/* Módulos */}
              <div className="p-4 sm:p-6 space-y-3">
                {weekData.modules.map((module) => (
                  <div
                    key={`${module.week_number}-${module.area_name}`}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      module.status_completed
                        ? 'border-emerald-500/50 bg-emerald-900/30'
                        : weekData.isLocked
                          ? 'border-slate-700 bg-slate-900/30 opacity-60'
                          : 'border-slate-700 bg-slate-900/50 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{module.area_name}</h4>
                        <p className="text-sm text-slate-400 mt-1">{module.subtopic_name}</p>
                      </div>
                      {module.status_completed && (
                        <div className="flex items-center gap-2 shrink-0 px-2 py-1 bg-emerald-500/20 rounded">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400">Concluído</span>
                        </div>
                      )}
                    </div>

                    {!module.status_completed && (
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={weekData.isLocked ? '#' : `/study?area=${encodeURIComponent(module.area_name)}`}
                          onClick={(e) => weekData.isLocked && e.preventDefault()}
                          className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                            weekData.isLocked
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                              : 'bg-blue-600/70 text-white hover:bg-blue-600'
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                          Resolver Questões
                        </Link>

                        <Link
                          href={weekData.isLocked ? '#' : `/flashcards?area=${encodeURIComponent(module.area_name)}`}
                          onClick={(e) => weekData.isLocked && e.preventDefault()}
                          className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                            weekData.isLocked
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                              : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                          }`}
                        >
                          <Brain className="w-4 h-4" />
                          Revisar Flashcards
                        </Link>

                        <button
                          onClick={() => handleCompleteModule(module.week_number, module.area_name)}
                          disabled={weekData.isLocked}
                          className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                            weekData.isLocked
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                              : 'bg-emerald-600/70 text-white hover:bg-emerald-600'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Marcar Concluído
                        </button>
                      </div>
                    )}

                    {module.status_completed && !weekData.isLocked && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Link
                          href={`/study?area=${encodeURIComponent(module.area_name)}`}
                          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md bg-slate-700 text-slate-300 hover:bg-blue-700 hover:text-white transition-colors"
                        >
                          <BookOpen className="w-4 h-4" />
                          Reiniciar Questões
                        </Link>
                        <Link
                          href={`/flashcards?area=${encodeURIComponent(module.area_name)}`}
                          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                        >
                          <Brain className="w-4 h-4" />
                          Reiniciar Flashcards
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Info Banner */}
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-4 sm:p-6 mt-8">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-300">Como funciona o plano?</h3>
              <ul className="text-sm text-blue-200/80 mt-2 space-y-1">
                <li>Verde: Semana/módulo concluído</li>
                <li>Azul: Semana em progresso (destravada)</li>
                <li>Cinza: Bloqueado – complete a semana anterior primeiro</li>
                <li>Clique em "Resolver Questões" para estudar com a matéria pré-selecionada</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
