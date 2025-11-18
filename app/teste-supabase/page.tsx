'use client'

import { useEffect, useState } from 'react'
import { supabase, getQuestoes } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export default function TesteSupabase() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [data, setData] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('[v0] Testing Supabase connection...')
        
        // Test connection by fetching one question
        const questoes = await getQuestoes(1)
        
        if (questoes && questoes.length > 0) {
          console.log('[v0] Successfully connected to Supabase')
          setData(questoes[0])
          setStatus('success')
        } else {
          console.log('[v0] No data returned from questoes table')
          setErrorMsg('Tabela questoes está vazia')
          setStatus('error')
        }
      } catch (error: any) {
        console.error('[v0] Supabase connection error:', error)
        setErrorMsg(error?.message || 'Erro ao conectar ao Supabase')
        setStatus('error')
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Teste de Conexão Supabase</h1>

        <Card className="p-6 mb-6">
          {status === 'loading' && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Conectando ao Supabase...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-green-800 dark:text-green-200 font-semibold">
                  ✓ Conectado com sucesso!
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="font-semibold text-foreground">Primeira Questão:</h2>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>

              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  ID da questão: <span className="font-mono font-semibold text-foreground">{data.id}</span>
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 font-semibold mb-2">✗ Erro na conexão</p>
              <p className="text-red-700 dark:text-red-300 text-sm">{errorMsg}</p>
              <p className="text-red-600 dark:text-red-400 text-xs mt-3">
                Verifique se as variáveis de ambiente estão configuradas corretamente:
              </p>
              <ul className="text-red-600 dark:text-red-400 text-xs mt-2 space-y-1">
                <li>• NEXT_PUBLIC_SUPABASE_URL</li>
                <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
            </div>
          )}
        </Card>

        <div className="flex gap-4">
          <Button asChild variant="default">
            <Link href="/dashboard">Voltar ao Dashboard</Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    </div>
  )
}
