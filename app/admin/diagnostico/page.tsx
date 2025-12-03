"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

const DiagnosticoContent = dynamic(() => import("./diagnostico-content"), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto p-6 max-w-4xl flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando diagnóstico...</p>
      </div>
    </div>
  ),
})

function DiagnosticoComponent() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [testEmail, setTestEmail] = useState("")
  const [testPassword, setTestPassword] = useState("")

  const addResult = (test: string, success: boolean, message: string, data?: any) => {
    setResults((prev) => [...prev, { test, success, message, data, timestamp: new Date().toLocaleTimeString() }])
  }

  const testConnection = async () => {
    setResults([])
    setLoading(true)

    try {
      const supabase = createClient()

      addResult("Conexão Supabase", true, "Cliente Supabase inicializado com sucesso")

      const { data: questoes, error: erroQuestoes } = await supabase
        .from("questoes")
        .select("id, tema, subtema")
        .limit(5)

      if (erroQuestoes) {
        addResult("Buscar Questões", false, erroQuestoes.message)
      } else {
        addResult("Buscar Questões", true, `${questoes?.length || 0} questões encontradas`, questoes)
      }

      const { data: assinaturas, error: erroAssinaturas } = await supabase.from("assinaturas").select("*")

      if (erroAssinaturas) {
        addResult("Buscar Assinaturas", false, erroAssinaturas.message)
      } else {
        addResult("Buscar Assinaturas", true, `${assinaturas?.length || 0} assinaturas encontradas`, assinaturas)
      }

      const {
        data: { session },
        error: erroSessao,
      } = await supabase.auth.getSession()

      if (erroSessao) {
        addResult("Verificar Sessão", false, erroSessao.message)
      } else if (session) {
        addResult("Verificar Sessão", true, `Usuário logado: ${session.user.email}`, {
          user_id: session.user.id,
          email: session.user.email,
        })
      } else {
        addResult("Verificar Sessão", true, "Nenhum usuário logado no momento")
      }

      const { data: historico, error: erroHistorico } = await supabase.from("hist_questoes").select("*").limit(5)

      if (erroHistorico) {
        addResult("Buscar Histórico", false, erroHistorico.message)
      } else {
        addResult("Buscar Histórico", true, `${historico?.length || 0} registros de histórico`, historico)
      }
    } catch (error: any) {
      addResult("Teste Geral", false, error.message)
    } finally {
      setLoading(false)
    }
  }

  const testSignup = async () => {
    if (!testEmail || !testPassword) {
      alert("Preencha email e senha para testar cadastro")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      addResult("Teste de Cadastro", true, `Tentando cadastrar: ${testEmail}`)

      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) {
        addResult("Cadastro Supabase Auth", false, error.message)
      } else {
        addResult("Cadastro Supabase Auth", true, "Usuário criado com sucesso!", {
          user_id: data.user?.id,
          email: data.user?.email,
        })

        if (data.user) {
          const { error: erroAssinatura } = await supabase.from("assinaturas").upsert({
            email: data.user.email,
            nome: data.user.email?.split("@")[0],
            status: "ativo",
            plano: "free",
          })

          if (erroAssinatura) {
            addResult("Adicionar Assinatura", false, erroAssinatura.message)
          } else {
            addResult("Adicionar Assinatura", true, "Usuário adicionado na tabela assinaturas com plano FREE")
          }
        }
      }
    } catch (error: any) {
      addResult("Erro no Teste de Cadastro", false, error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico do Sistema - Bora Revalidar</CardTitle>
          <CardDescription>Teste as conexões com o novo projeto Supabase: fmhzwcbjjdkcylohqfyy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Teste de Conexão</h3>
              <Button onClick={testConnection} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Testar Conexão com Banco de Dados
              </Button>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Teste de Cadastro</h3>
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email de teste"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Senha de teste (mín. 6 caracteres)"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                />
                <Button onClick={testSignup} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Testar Cadastro de Usuário
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Resultados dos Testes:</h3>
            {results.length === 0 ? (
              <Alert>
                <AlertDescription>Nenhum teste executado ainda</AlertDescription>
              </Alert>
            ) : (
              results.map((result, index) => (
                <Alert key={index} variant={result.success ? "default" : "destructive"}>
                  <div className="flex items-start gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{result.test}</div>
                      <AlertDescription>{result.message}</AlertDescription>
                      {result.data && (
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">{result.timestamp}</div>
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </div>

          <Alert>
            <AlertDescription>
              <strong>Informações do Projeto:</strong>
              <br />
              URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}
              <br />
              Project ID: fmhzwcbjjdkcylohqfyy
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DiagnosticoPage() {
  return <DiagnosticoContent />
}
