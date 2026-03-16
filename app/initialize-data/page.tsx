'use client'

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function InitializeDataPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)

  const handleInitializeData = async () => {
    setIsLoading(true)
    setStatus('idle')
    setProgress(0)
    setMessage('Iniciando...')

    try {
      // Passo 1: Criar usuários de teste
      setProgress(25)
      setMessage('Criando usuários de teste...')

      const usersResponse = await fetch('/api/initialize-test-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-users' }),
      })

      if (!usersResponse.ok) {
        throw new Error('Erro ao criar usuários')
      }

      const usersData = await usersResponse.json()
      const testUserIds = usersData.userIds || []

      // Passo 2: Simular dados para cada usuário
      setProgress(50)
      setMessage(`Simulando respostas para ${testUserIds.length} usuários...`)

      for (const userId of testUserIds) {
        await fetch('/api/initialize-test-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'simulate-responses',
            userId,
            responseCount: 30,
          }),
        })
      }

      // Passo 3: Completar módulos
      setProgress(75)
      setMessage('Marcando módulos como completos...')

      for (const userId of testUserIds) {
        await fetch('/api/initialize-test-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'complete-modules',
            userId,
          }),
        })
      }

      // Passo 4: Calcular weak topics
      setProgress(90)
      setMessage('Calculando pontos fracos...')

      for (const userId of testUserIds) {
        await fetch('/api/initialize-test-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'calculate-weak-topics',
            userId,
          }),
        })
      }

      setProgress(100)
      setStatus('success')
      setMessage(
        `✓ Dados inicializados com sucesso! ${testUserIds.length} usuários criados com respostas simuladas.`
      )
    } catch (error) {
      setStatus('error')
      setMessage(`✗ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      console.error('[v0] Erro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={null} />

      <main className="mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-2">Inicializar Dados de Teste</h1>
          <p className="text-muted-foreground">
            Populará o banco com usuários de teste e dados simulados para demonstração do ranking semanal.
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="space-y-6">
            {/* Descrição do que será feito */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">O que será criado:</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>5 usuários de teste com diferentes níveis de desempenho</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>~150 respostas simuladas em questões (70% corretas, 30% incorretas)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Pontos distribuídos: +10 por correta, +2 por incorreta</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Identificação automática de pontos fracos (erro {'>'} 40%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Ranking semanal com top 5 usuários</span>
                </li>
              </ul>
            </div>

            {/* Status Message */}
            {message && (
              <div
                className={`p-3 rounded-lg flex items-start gap-2 text-sm ${
                  status === 'success'
                    ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    : status === 'error'
                      ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      : 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                }`}
              >
                {status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : status === 'error' ? (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <Loader2 className="w-5 h-5 flex-shrink-0 mt-0.5 animate-spin" />
                )}
                <span>{message}</span>
              </div>
            )}

            {/* Progress Bar */}
            {isLoading && progress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold text-foreground">{progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Credenciais de Teste */}
            {status === 'success' && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-foreground text-sm">Credenciais de Teste:</h3>
                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <p className="text-muted-foreground">Usuários criados:</p>
                    <p className="text-foreground">teste1@revalida.com → Dr. Teste 1</p>
                    <p className="text-foreground">teste2@revalida.com → Dra. Teste 2</p>
                    <p className="text-foreground">teste3@revalida.com → Dr. Teste 3</p>
                    <p className="text-foreground">teste4@revalida.com → Dr. Teste 4</p>
                    <p className="text-foreground">teste5@revalida.com → Dra. Teste 5</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-muted-foreground">Senha para todos:</p>
                    <p className="text-foreground">TestPassword123!</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botão de Ação */}
            <button
              onClick={handleInitializeData}
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground font-medium py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Inicializando...
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Concluído!
                </>
              ) : (
                'Inicializar Dados de Teste'
              )}
            </button>

            {/* Links de Navegação */}
            {status === 'success' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/ranking-semanal"
                  className="text-center text-sm font-medium text-primary hover:underline"
                >
                  Ver Ranking →
                </Link>
                <Link
                  href="/pontos-fracos"
                  className="text-center text-sm font-medium text-primary hover:underline"
                >
                  Ver Pontos Fracos →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="text-xs text-muted-foreground space-y-2">
          <p>
            Esta página é para fins de demonstração. Os dados criados aqui ajudam a testar o sistema
            de ranking, plano de estudo e detecção de pontos fracos.
          </p>
          <p>
            Você pode fazer login com qualquer um dos usuários de teste criados para verificar o progresso
            individual.
          </p>
        </div>
      </main>
    </div>
  )
}
