"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth-supabase"
import {
  getUserStats,
  getMetasUsuario,
  getBadgesUsuario,
  getNotificacoesUsuario,
  gerarMetasAutomaticas,
  verificarEDesbloquearBadges,
  gerarNotificacoesInteligentes,
  marcarNotificacaoComoLida,
  type UserStats,
  type Meta,
  type Badge,
  type Notification,
} from "@/lib/ranking-system"
import { Trophy, TrendingUp, TrendingDown, Minus, Target, Award, Bell, ArrowLeft, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default function RankingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [metas, setMetas] = useState<Meta[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState<"desempenho" | "metas" | "badges" | "notificacoes">("desempenho")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Carregar estatísticas
      const userStats = await getUserStats(user.id)
      setStats(userStats)

      // Gerar e carregar metas
      await gerarMetasAutomaticas(user.id)
      const userMetas = await getMetasUsuario(user.id)
      setMetas(userMetas)

      // Verificar e carregar badges
      await verificarEDesbloquearBadges(user.id)
      const userBadges = await getBadgesUsuario(user.id)
      setBadges(userBadges)

      // Gerar e carregar notificações
      await gerarNotificacoesInteligentes(user.id)
      const userNotifications = await getNotificacoesUsuario(user.id)
      setNotifications(userNotifications)

      setLoading(false)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      setLoading(false)
    }
  }

  async function handleMarcarLida(notificationId: string) {
    await marcarNotificacaoComoLida(notificationId)
    setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, lida: true } : n)))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando seu desempenho...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Erro ao carregar dados</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push("/dashboard")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Meu Desempenho</h1>
          <div className="w-20"></div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("desempenho")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "desempenho" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
            }`}
          >
            Desempenho
          </button>
          <button
            onClick={() => setActiveTab("metas")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "metas" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
            }`}
          >
            Metas
          </button>
          <button
            onClick={() => setActiveTab("badges")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "badges" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
            }`}
          >
            Conquistas
          </button>
          <button
            onClick={() => setActiveTab("notificacoes")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap relative ${
              activeTab === "notificacoes" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
            }`}
          >
            Notificações
            {notifications.filter((n) => !n.lida).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.filter((n) => !n.lida).length}
              </span>
            )}
          </button>
        </div>

        {/* Conteúdo */}
        {activeTab === "desempenho" && (
          <div className="space-y-6">
            {/* Cards de Estatísticas Principais */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
                <div className="text-3xl font-bold mb-1">{stats.taxaAcertoGeral}%</div>
                <div className="text-sm text-blue-100">Taxa de Acerto Geral</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
                <div className="text-3xl font-bold mb-1">{stats.diasConsecutivos}</div>
                <div className="text-sm text-purple-100">Dias Consecutivos</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
                <div className="text-3xl font-bold mb-1">{stats.questoesRespondidas}</div>
                <div className="text-sm text-green-100">Questões Respondidas</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6">
                <div className="text-3xl font-bold mb-1">{stats.simuladosRealizados}</div>
                <div className="text-sm text-orange-100">Simulados Realizados</div>
              </div>
            </div>

            {/* Desempenho por Categoria */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Desempenho por Categoria
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Questões</span>
                    <span className="text-sm font-bold">{stats.taxaAcertoQuestoes}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div
                      className="bg-primary rounded-full h-3 transition-all"
                      style={{ width: `${stats.taxaAcertoQuestoes}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Simulados</span>
                    <span className="text-sm font-bold">{stats.taxaAcertoSimulados}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div
                      className="bg-teal-500 rounded-full h-3 transition-all"
                      style={{ width: `${stats.taxaAcertoSimulados}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Flashcards</span>
                    <span className="text-sm font-bold">{stats.taxaAcertoFlashcards}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div
                      className="bg-purple-500 rounded-full h-3 transition-all"
                      style={{ width: `${stats.taxaAcertoFlashcards}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Evolução */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <h2 className="text-xl font-bold mb-4">Evolução do Desempenho</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-2">Últimos 7 dias</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{stats.evolucao7dias}%</span>
                    {stats.evolucao7dias > stats.evolucao30dias ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : stats.evolucao7dias < stats.evolucao30dias ? (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    ) : (
                      <Minus className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="bg-background rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-2">Últimos 30 dias</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{stats.evolucao30dias}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desempenho por Matéria */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <h2 className="text-xl font-bold mb-4">Top 5 Matérias</h2>
              <div className="space-y-3">
                {stats.desempenhoPorMateria.map((materia, idx) => (
                  <div key={idx} className="bg-background rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{materia.materia}</span>
                      <span className="text-sm font-bold">{materia.taxa}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${materia.taxa}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {materia.corretas}/{materia.total} corretas
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "metas" && (
          <div className="space-y-4">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Suas Metas
              </h2>
              {metas.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma meta ativa no momento</p>
              ) : (
                <div className="space-y-4">
                  {metas.map((meta) => (
                    <div key={meta.id} className="bg-background rounded-lg p-4 border border-border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{meta.descricao}</h3>
                          <p className="text-xs text-muted-foreground">
                            {meta.tipo === "diaria" ? "Meta Diária" : "Meta Semanal"}
                          </p>
                        </div>
                        <span className="text-sm font-bold">
                          {meta.progressoAtual}/{meta.metaValor}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-3 mb-2">
                        <div
                          className="bg-primary rounded-full h-3 transition-all"
                          style={{ width: `${(meta.progressoAtual / meta.metaValor) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {meta.completada ? (
                          <span className="text-green-500 font-medium">✓ Completada!</span>
                        ) : (
                          `${Math.round((meta.progressoAtual / meta.metaValor) * 100)}% concluída`
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "badges" && (
          <div className="space-y-4">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Suas Conquistas
              </h2>
              {badges.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Continue estudando para desbloquear badges!</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`rounded-xl p-6 text-center border-2 transition-all ${
                        badge.desbloqueado
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-500 border-yellow-600"
                          : "bg-card border-border opacity-50"
                      }`}
                    >
                      <div className="text-4xl mb-2">{badge.badgeIcone}</div>
                      <h3 className="font-bold text-sm mb-1">{badge.badgeNome}</h3>
                      <p className="text-xs text-muted-foreground">{badge.badgeDescricao}</p>
                      {badge.desbloqueado && badge.dataDesbloqueio && (
                        <p className="text-xs mt-2 opacity-70">
                          {new Date(badge.dataDesbloqueio).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "notificacoes" && (
          <div className="space-y-4">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notificações
              </h2>
              {notifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma notificação no momento</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`rounded-lg p-4 border transition-all cursor-pointer ${
                        notif.lida ? "bg-background border-border opacity-70" : "bg-card border-primary"
                      }`}
                      onClick={() => !notif.lida && handleMarcarLida(notif.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            notif.tipo === "lembrete"
                              ? "bg-blue-500/20 text-blue-500"
                              : notif.tipo === "progresso"
                                ? "bg-green-500/20 text-green-500"
                                : notif.tipo === "alerta"
                                  ? "bg-red-500/20 text-red-500"
                                  : "bg-yellow-500/20 text-yellow-500"
                          }`}
                        >
                          {notif.tipo === "lembrete" && <Bell className="w-4 h-4" />}
                          {notif.tipo === "progresso" && <TrendingUp className="w-4 h-4" />}
                          {notif.tipo === "alerta" && <TrendingDown className="w-4 h-4" />}
                          {notif.tipo === "incentivo" && <Zap className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{notif.titulo}</h3>
                          <p className="text-sm text-muted-foreground">{notif.mensagem}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notif.dataCriacao).toLocaleString()}
                          </p>
                        </div>
                        {!notif.lida && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
