'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, BookOpen, Brain, RefreshCw, Play, ChevronRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'

interface SmartReviewSectionProps {
  userId: string
}

interface ReviewStats {
  total: number
  questoes: number
  flashcards: number
}

export function SmartReviewSection({ userId }: SmartReviewSectionProps) {
  const [stats, setStats] = useState<ReviewStats>({ total: 0, questoes: 0, flashcards: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      
      let questoesPendentes = 0
      let flashcardsPendentes = 0

      // Buscar questoes erradas do historico
      const { data: questoesErradas, error: questoesError } = await supabase
        .from('hist_questoes')
        .select('questao_id')
        .eq('user_id', userId)
        .eq('correta', false)

      if (!questoesError && questoesErradas) {
        const uniqueQuestoes = new Set(questoesErradas.map(q => q.questao_id))
        questoesPendentes = uniqueQuestoes.size
      }

      // Buscar flashcards errados do historico
      const { data: flashcardsErrados, error: flashcardsError } = await supabase
        .from('flashcard_history')
        .select('flashcard_id')
        .eq('user_id', userId)
        .eq('correct', false)

      if (!flashcardsError && flashcardsErrados) {
        const uniqueFlashcards = new Set(flashcardsErrados.map(f => f.flashcard_id))
        flashcardsPendentes = uniqueFlashcards.size
      }

      const total = questoesPendentes + flashcardsPendentes

      setStats({
        total,
        questoes: questoesPendentes,
        flashcards: flashcardsPendentes
      })
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Erro ao carregar estatisticas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [userId])

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-700 rounded mb-4 w-1/3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-700 rounded w-full"></div>
          <div className="h-4 bg-slate-700 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-900/30 via-slate-900/50 to-purple-900/20 border-2 border-blue-700/50 rounded-xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500/30 to-purple-500/20 rounded-xl border border-blue-500/30">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-white flex items-center gap-2">
              Revisao Inteligente
              {stats.total > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {stats.total}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">Itens pendentes para revisao</p>
          </div>
        </div>
        <button
          onClick={loadStats}
          disabled={isLoading}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
          title="Atualizar"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats cards */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.questoes}</p>
            <p className="text-xs text-slate-400">Questoes</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Brain className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stats.flashcards}</p>
            <p className="text-xs text-slate-400">Flashcards</p>
          </div>
        </div>
      )}

      {/* CTA Button */}
      {stats.total > 0 ? (
        <Link
          href="/review"
          className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/30 group border border-blue-400/20"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="block text-lg">Iniciar Revisao</span>
              <span className="block text-xs text-blue-200 font-normal">
                {stats.questoes > 0 && `${stats.questoes} questoes`}
                {stats.questoes > 0 && stats.flashcards > 0 && ' + '}
                {stats.flashcards > 0 && `${stats.flashcards} flashcards`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              {stats.total} itens
            </span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      ) : (
        <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-xl">
            <AlertCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-emerald-300 font-semibold">Tudo em dia!</p>
            <p className="text-emerald-400/70 text-sm mt-0.5">
              Nenhum conteudo pendente para revisao.
            </p>
          </div>
          <Link 
            href="/flashcards" 
            className="px-4 py-2 bg-emerald-600/20 text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-600/30 transition-colors border border-emerald-600/30"
          >
            Estudar novos
          </Link>
        </div>
      )}

      {/* Last updated */}
      {lastUpdated && (
        <p className="text-xs text-slate-500 text-center mt-4">
          Atualizado {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ptBR })}
        </p>
      )}
    </div>
  )
}
