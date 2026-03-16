'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseUser } from '@/lib/auth-supabase'
import { Navbar } from '@/components/navbar'
import { getWeeklyRanking, getUserRankingPosition, getUserWeeklyPoints, type WeakTopic } from '@/lib/gamification'
import { ArrowLeft, Trophy, Medal, TrendingUp } from 'lucide-react'

interface RankingUser {
  position: number
  userId: string
  email: string
  name: string
  points: number
  medal: string | null
}

export default function RankingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [ranking, setRanking] = useState<RankingUser[]>([])
  const [userPosition, setUserPosition] = useState(0)
  const [userPoints, setUserPoints] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getSupabaseUser()
        if (!currentUser) {
          router.push('/login')
          return
        }

        setUser(currentUser)

        // Carregar ranking
        const rankingData = await getWeeklyRanking(100)
        setRanking(rankingData)

        // Obter posição do usuário
        const { position, userPoints: points } = await getUserRankingPosition(currentUser.id)
        setUserPosition(position)
        setUserPoints(points)

        setIsLoading(false)
      } catch (error) {
        console.error('[v0] Erro ao carregar ranking:', error)
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
        <Navbar user={user} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300">Carregando ranking...</p>
          </div>
        </div>
      </div>
    )
  }

  const topThree = ranking.slice(0, 3)
  const restRanking = ranking.slice(3)
  const getMedalColor = (position: number) => {
    switch (position) {
      case 1:
        return 'from-amber-400 to-amber-600'
      case 2:
        return 'from-slate-300 to-slate-500'
      case 3:
        return 'from-orange-400 to-orange-600'
      default:
        return ''
    }
  }

  const getMedalBg = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-amber-100/20'
      case 2:
        return 'bg-slate-700/20'
      case 3:
        return 'bg-orange-100/20'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      <Navbar user={user} />

      <main className="mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl">
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
            Ranking Semanal
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Veja sua posição e compita com outros estudantes do Revalida
          </p>
        </div>

        {/* Sua Posição */}
        {userPosition > 0 && (
          <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border-2 border-emerald-500/50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-400">Sua Posição</h3>
                <p className="text-3xl font-bold text-emerald-400 mt-1">
                  #{userPosition} lugar
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Pontuação</p>
                <p className="text-3xl font-bold text-emerald-400">{userPoints}</p>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 - Podium */}
        {topThree.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg font-bold text-white mb-4">Pódio</h2>

            {/* 1º Lugar - Centro (maior) */}
            {topThree[0] && (
              <div className="mb-6">
                <div className={`bg-gradient-to-br ${getMedalColor(1)} rounded-t-2xl p-4 sm:p-8 text-white text-center relative overflow-hidden`}>
                  {/* Confetti background */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-2 left-2">★</div>
                    <div className="absolute top-4 right-4">★</div>
                    <div className="absolute bottom-3 left-6">★</div>
                    <div className="absolute bottom-2 right-8">★</div>
                  </div>

                  <div className="relative z-10">
                    <div className="text-5xl sm:text-6xl font-bold mb-2">🥇</div>
                    <h3 className="text-lg sm:text-xl font-bold">{topThree[0].name}</h3>
                    <p className="text-white/90 text-sm mt-1">{topThree[0].email}</p>
                  </div>
                </div>
                <div className="bg-slate-800/50 border-2 border-t-0 border-amber-500/30 rounded-b-xl p-4 text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-amber-400">{topThree[0].points}</div>
                  <p className="text-xs text-slate-400 mt-1">pontos</p>
                </div>
              </div>
            )}

            {/* 2º e 3º Lugar - Grid */}
            {(topThree[1] || topThree[2]) && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {topThree[1] && (
                  <div>
                    <div className={`bg-gradient-to-br ${getMedalColor(2)} rounded-t-xl p-4 sm:p-6 text-white text-center`}>
                      <div className="text-3xl sm:text-4xl font-bold mb-1">🥈</div>
                      <h3 className="text-sm sm:text-base font-bold">{topThree[1].name}</h3>
                      <p className="text-white/80 text-xs mt-0.5 truncate">{topThree[1].email}</p>
                    </div>
                    <div className="bg-slate-800/50 border-2 border-t-0 border-slate-500/30 rounded-b-xl p-3 text-center">
                      <div className="text-2xl font-bold text-slate-300">{topThree[1].points}</div>
                      <p className="text-xs text-slate-500">pontos</p>
                    </div>
                  </div>
                )}

                {topThree[2] && (
                  <div>
                    <div className={`bg-gradient-to-br ${getMedalColor(3)} rounded-t-xl p-4 sm:p-6 text-white text-center`}>
                      <div className="text-3xl sm:text-4xl font-bold mb-1">🥉</div>
                      <h3 className="text-sm sm:text-base font-bold">{topThree[2].name}</h3>
                      <p className="text-white/80 text-xs mt-0.5 truncate">{topThree[2].email}</p>
                    </div>
                    <div className="bg-slate-800/50 border-2 border-t-0 border-orange-500/30 rounded-b-xl p-3 text-center">
                      <div className="text-2xl font-bold text-orange-400">{topThree[2].points}</div>
                      <p className="text-xs text-slate-400">pontos</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Ranking Completo */}
        {ranking.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Ranking Completo</h2>

            <div className="space-y-2">
              {ranking.map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    entry.userId === user?.id
                      ? 'bg-emerald-500/10 border-emerald-500/50'
                      : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Posição */}
                    <div className="text-lg font-bold text-slate-400 w-8 text-center shrink-0">
                      {entry.medal ? entry.medal : `#${entry.position}`}
                    </div>

                    {/* Info do usuário */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white text-sm sm:text-base truncate">
                        {entry.name}
                        {entry.userId === user?.id && (
                          <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                            Você
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">{entry.email}</p>
                    </div>
                  </div>

                  {/* Pontos */}
                  <div className="text-right shrink-0">
                    <div className="text-lg sm:text-2xl font-bold text-emerald-400">{entry.points}</div>
                    <p className="text-xs text-slate-500">pts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info sobre pontuação */}
        <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 sm:p-6 mt-8">
          <div className="flex gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Como ganhar pontos?</h3>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Questão correta: +10 pontos</li>
                <li>• Questão errada: +2 pontos</li>
                <li>• Concluir módulo: +50 pontos</li>
                <li>• Sessão de flashcards: +5 pontos</li>
              </ul>
              <p className="text-xs text-blue-700 mt-3 font-medium">
                O ranking reseta toda segunda-feira à meia-noite
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
