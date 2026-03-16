'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, CheckCircle, Lock, BookOpen, Brain, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

// ─── Constantes ───────────────────────────────────────────────────────────────

const AREAS = [
  'Clínica Médica',
  'Clínica Cirúrgica',
  'Pediatria',
  'Ginecologia e Obstetrícia',
  'Medicina Preventiva',
] as const

type Area = typeof AREAS[number]

// Subtemas exatos da tabela questoes no Supabase
// Clínica Médica: 17 subtemas
// Clínica Cirúrgica (tema="Cirurgia"): 8 subtemas
// Pediatria: 13 subtemas
// Ginecologia e Obstetrícia: 5 subtemas
// Medicina Preventiva: 5 subtemas
const WEEKS_PLAN: Record<number, Record<Area, string>> = {
  1:  { 'Clínica Médica': 'Cardiologia',             'Clínica Cirúrgica': 'Abdome Agudo / Cirurgia Digestiva',       'Pediatria': 'Neonatologia',                        'Ginecologia e Obstetrícia': 'Pré-natal e Obstetrícia',     'Medicina Preventiva': 'Políticas Públicas de Saúde' },
  2:  { 'Clínica Médica': 'Infectologia',             'Clínica Cirúrgica': 'Trauma / ATLS',                          'Pediatria': 'Infectologia Pediátrica',              'Ginecologia e Obstetrícia': 'Ginecologia Geral',           'Medicina Preventiva': 'Epidemiologia' },
  3:  { 'Clínica Médica': 'Pneumologia',              'Clínica Cirúrgica': 'Ortopedia e Traumatologia',              'Pediatria': 'Pneumologia Pediátrica',               'Ginecologia e Obstetrícia': 'IST / Infecções Ginecológicas','Medicina Preventiva': 'APS / Saúde da Família' },
  4:  { 'Clínica Médica': 'Gastroenterologia',        'Clínica Cirúrgica': 'Oncologia Cirúrgica',                    'Pediatria': 'Crescimento e Desenvolvimento',        'Ginecologia e Obstetrícia': 'Oncologia Ginecológica',       'Medicina Preventiva': 'Imunizações e Vigilância Epidemiológica' },
  5:  { 'Clínica Médica': 'Endocrinologia',           'Clínica Cirúrgica': 'Urologia / Proctologia',                 'Pediatria': 'Gastroenterologia Pediátrica',         'Ginecologia e Obstetrícia': 'Endocrinologia Reprodutiva',   'Medicina Preventiva': 'Ética Médica e Bioética' },
  6:  { 'Clínica Médica': 'Nefrologia / Urologia',   'Clínica Cirúrgica': 'Pós-operatório / Complicações Cirúrgicas','Pediatria': 'Neurologia Pediátrica',                'Ginecologia e Obstetrícia': 'Pré-natal e Obstetrícia',      'Medicina Preventiva': 'Epidemiologia' },
  7:  { 'Clínica Médica': 'Neurologia',               'Clínica Cirúrgica': 'Feridas / Técnica Cirúrgica',            'Pediatria': 'Hematologia / Oncologia Pediátrica',   'Ginecologia e Obstetrícia': 'Ginecologia Geral',            'Medicina Preventiva': 'APS / Saúde da Família' },
  8:  { 'Clínica Médica': 'Hematologia',              'Clínica Cirúrgica': 'Urgências Clínicas / Outros',            'Pediatria': 'Imunizações e Vigilância Epidemiológica','Ginecologia e Obstetrícia': 'IST / Infecções Ginecológicas','Medicina Preventiva': 'Políticas Públicas de Saúde' },
  9:  { 'Clínica Médica': 'Reumatologia',             'Clínica Cirúrgica': 'Abdome Agudo / Cirurgia Digestiva',       'Pediatria': 'Urgências Pediátricas',                'Ginecologia e Obstetrícia': 'Oncologia Ginecológica',       'Medicina Preventiva': 'Imunizações e Vigilância Epidemiológica' },
  10: { 'Clínica Médica': 'Urgências Clínicas / Outros','Clínica Cirúrgica': 'Trauma / ATLS',                        'Pediatria': 'Saúde da Criança e Adolescente',       'Ginecologia e Obstetrícia': 'Endocrinologia Reprodutiva',   'Medicina Preventiva': 'Ética Médica e Bioética' },
  11: { 'Clínica Médica': 'Cardiologia',              'Clínica Cirúrgica': 'Ortopedia e Traumatologia',              'Pediatria': 'Neonatologia',                         'Ginecologia e Obstetrícia': 'Pré-natal e Obstetrícia',      'Medicina Preventiva': 'APS / Saúde da Família' },
  12: { 'Clínica Médica': 'Psiquiatria',              'Clínica Cirúrgica': 'Oncologia Cirúrgica',                    'Pediatria': 'Psiquiatria / Comportamento',           'Ginecologia e Obstetrícia': 'Ginecologia Geral',            'Medicina Preventiva': 'Epidemiologia' },
  13: { 'Clínica Médica': 'Oncologia / Hematologia',  'Clínica Cirúrgica': 'Urologia / Proctologia',                 'Pediatria': 'Endocrinologia / Adolescência',         'Ginecologia e Obstetrícia': 'IST / Infecções Ginecológicas', 'Medicina Preventiva': 'Políticas Públicas de Saúde' },
  14: { 'Clínica Médica': 'Dermatologia',             'Clínica Cirúrgica': 'Feridas / Técnica Cirúrgica',            'Pediatria': 'Ortopedia / Cirurgia Pediátrica',      'Ginecologia e Obstetrícia': 'Oncologia Ginecológica',       'Medicina Preventiva': 'Imunizações e Vigilância Epidemiológica' },
  15: { 'Clínica Médica': 'Geriatria',                'Clínica Cirúrgica': 'Pós-operatório / Complicações Cirúrgicas','Pediatria': 'Infectologia Pediátrica',              'Ginecologia e Obstetrícia': 'Endocrinologia Reprodutiva',   'Medicina Preventiva': 'Ética Médica e Bioética' },
  16: { 'Clínica Médica': 'Oftalmologia',             'Clínica Cirúrgica': 'Urgências Clínicas / Outros',            'Pediatria': 'Crescimento e Desenvolvimento',         'Ginecologia e Obstetrícia': 'Pré-natal e Obstetrícia',      'Medicina Preventiva': 'APS / Saúde da Família' },
  17: { 'Clínica Médica': 'Reumatologia / Ortopedia', 'Clínica Cirúrgica': 'Abdome Agudo / Cirurgia Digestiva',      'Pediatria': 'Neurologia Pediátrica',                'Ginecologia e Obstetrícia': 'Ginecologia Geral',            'Medicina Preventiva': 'Epidemiologia' },
  18: { 'Clínica Médica': 'Clínica Geral',            'Clínica Cirúrgica': 'Trauma / ATLS',                          'Pediatria': 'Pneumologia Pediátrica',               'Ginecologia e Obstetrícia': 'IST / Infecções Ginecológicas', 'Medicina Preventiva': 'Imunizações e Vigilância Epidemiológica' },
  19: { 'Clínica Médica': 'Urgências Clínicas / Outros','Clínica Cirúrgica': 'Ortopedia e Traumatologia',            'Pediatria': 'Hematologia / Oncologia Pediátrica',   'Ginecologia e Obstetrícia': 'Oncologia Ginecológica',       'Medicina Preventiva': 'Políticas Públicas de Saúde' },
  20: { 'Clínica Médica': 'Cardiologia',              'Clínica Cirúrgica': 'Abdome Agudo / Cirurgia Digestiva',      'Pediatria': 'Saúde da Criança e Adolescente',       'Ginecologia e Obstetrícia': 'Pré-natal e Obstetrícia',      'Medicina Preventiva': 'Epidemiologia' },
}

// Versão atual do plano — incrementar força reset automático do progresso salvo
const PLAN_VERSION = 'v3-subtemas-reais'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ModuleProgress {
  status_completed: boolean
  completed_at: string | null
}

type ProgressStore = Record<string, ModuleProgress> // chave: "week-area"

function progressKey(week: number, area: string) {
  return `${week}::${area}`
}

function loadProgress(userId: string): ProgressStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(`plano_progresso_${userId}`)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    // Se for versão antiga, reset
    if (parsed.__version !== PLAN_VERSION) return {}
    return parsed.data || {}
  } catch {
    return {}
  }
}

function saveProgress(userId: string, store: ProgressStore) {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    `plano_progresso_${userId}`,
    JSON.stringify({ __version: PLAN_VERSION, data: store }),
  )
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PlanoDeEstudosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [progress, setProgress] = useState<ProgressStore>({})
  const [currentWeek, setCurrentWeek] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]))

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/login'); return }
      setUser(u)

      const stored = loadProgress(u.id)
      setProgress(stored)

      // Calcular semana atual com base no progresso salvo
      let cw = 1
      for (let w = 1; w <= 20; w++) {
        const doneAll = AREAS.every((a) => stored[progressKey(w, a)]?.status_completed)
        if (!doneAll) { cw = w; break }
        if (w === 20) cw = 21
      }
      setCurrentWeek(cw)
      setExpandedWeeks(new Set([cw]))
      setIsLoading(false)
    }
    init()
  }, [router])

  function handleComplete(week: number, area: Area) {
    if (!user) return
    const key = progressKey(week, area)
    const next: ProgressStore = {
      ...progress,
      [key]: { status_completed: true, completed_at: new Date().toISOString() },
    }
    setProgress(next)
    saveProgress(user.id, next)

    // Recalcular semana atual
    let cw = 1
    for (let w = 1; w <= 20; w++) {
      const doneAll = AREAS.every((a) => {
        const k = progressKey(w, a)
        return (w === week && a === area) ? true : next[k]?.status_completed
      })
      if (!doneAll) { cw = w; break }
      if (w === 20) cw = 21
    }
    setCurrentWeek(cw)
  }

  function toggleWeek(week: number) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev)
      if (next.has(week)) next.delete(week)
      else next.add(week)
      return next
    })
  }

  // ─── Dados computados ───────────────────────────────────────────────────────

  const totalModules = 20 * AREAS.length
  const totalCompleted = Object.values(progress).filter((p) => p.status_completed).length
  const overallProgress = Math.round((totalCompleted / totalModules) * 100)

  // ─── Tela de carregamento ────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar user={user} />
        <div className="flex items-center justify-center pt-32">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Carregando plano de estudos...</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar user={user} />
      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Plano de Estudos</h1>
            <p className="text-slate-400 text-sm">Trilha de 20 semanas para o Revalida</p>
          </div>
        </div>

        {/* Progresso geral */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 font-medium text-sm">Progresso Geral</span>
            <span className="text-white font-bold">{overallProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-slate-500 text-xs mt-2">
            {totalCompleted} de {totalModules} módulos — Semana atual:{' '}
            {currentWeek > 20 ? 'Plano concluído!' : currentWeek}
          </p>
        </div>

        {/* Semanas */}
        <div className="space-y-2">
          {Array.from({ length: 20 }, (_, i) => {
            const week = i + 1
            const completedCount = AREAS.filter(
              (a) => progress[progressKey(week, a)]?.status_completed,
            ).length
            const isCompleted = completedCount === AREAS.length
            const isCurrent = week === currentWeek
            const isLocked = week > currentWeek + 1
            const isExpanded = expandedWeeks.has(week)

            return (
              <div
                key={week}
                className={`border rounded-xl overflow-hidden transition-all ${
                  isCompleted
                    ? 'border-emerald-800/50 bg-emerald-950/20'
                    : isCurrent
                      ? 'border-blue-700/60 bg-blue-950/20'
                      : isLocked
                        ? 'border-slate-800/50 bg-slate-900/30 opacity-50'
                        : 'border-slate-800 bg-slate-900/50'
                }`}
              >
                {/* Header */}
                <button
                  onClick={() => !isLocked && toggleWeek(week)}
                  disabled={isLocked}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    {isLocked ? (
                      <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                    ) : isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${isCurrent ? 'border-blue-400' : 'border-slate-600'}`} />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">Semana {week}</span>
                        {isCurrent && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                            Atual
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-xs bg-emerald-800/60 text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                            Concluída
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {completedCount}/{AREAS.length} módulos concluídos
                      </p>
                    </div>
                  </div>
                  {!isLocked && (
                    isExpanded
                      ? <ChevronUp className="w-4 h-4 text-slate-500" />
                      : <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {/* Módulos */}
                {isExpanded && !isLocked && (
                  <div className="border-t border-slate-800 divide-y divide-slate-800/40">
                    {AREAS.map((area) => {
                      const subtema = WEEKS_PLAN[week][area]
                      const done = progress[progressKey(week, area)]?.status_completed ?? false

                      return (
                        <div
                          key={area}
                          className={`px-5 py-4 ${done ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-start gap-2 mb-3">
                            {done ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide leading-tight">
                                {area}
                              </p>
                              <p className="text-sm text-white mt-0.5">{subtema}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pl-6">
                            <Link
                              href={`/study?area=${encodeURIComponent(area)}&subtema=${encodeURIComponent(subtema)}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 border border-blue-700/30 transition-colors"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              {done ? 'Refazer Questões' : 'Resolver Questões'}
                            </Link>

                            <Link
                              href={`/flashcards?area=${encodeURIComponent(area)}&subtema=${encodeURIComponent(subtema)}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-700/50 transition-colors"
                            >
                              <Brain className="w-3.5 h-3.5" />
                              {done ? 'Refazer Flashcards' : 'Revisar Flashcards'}
                            </Link>

                            {!done && (
                              <button
                                onClick={() => handleComplete(week, area)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-700/20 text-emerald-300 hover:bg-emerald-700/40 border border-emerald-700/30 transition-colors"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Marcar Concluído
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
