"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Users, UserCheck } from "lucide-react"

export default function UsuariosPage() {
  const [stats, setStats] = useState<any>(null)
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      // Buscar estatísticas
      const { data: statsData } = await supabase.rpc("get_user_stats")

      // Buscar usuários recentes
      const { data: usersData } = await supabase
        .from("assinaturas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20)

      setStats(statsData?.[0] || { total_auth: 0, total_assinaturas: 0, faltando: 0 })
      setUsuarios(usersData || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>Carregando...</p>
      </div>
    )
  }

  const allUsersSynced = stats?.faltando === 0

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Monitoramento de Usuários</h1>
        <p className="text-muted-foreground">Verificação de sincronização entre auth.users e tabela assinaturas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Auth Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_auth || 0}</div>
            <p className="text-xs text-muted-foreground">Usuários cadastrados no Supabase Auth</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assinaturas</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_assinaturas || 0}</div>
            <p className="text-xs text-muted-foreground">Usuários na tabela assinaturas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Sincronização</CardTitle>
            {allUsersSynced ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allUsersSynced ? (
                <span className="text-green-500">100%</span>
              ) : (
                <span className="text-red-500">{stats?.faltando || 0} faltando</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {allUsersSynced ? "Todos os usuários sincronizados" : "Usuários sem assinatura"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos 20 Usuários Cadastrados</CardTitle>
          <CardDescription>Lista dos usuários mais recentes na tabela assinaturas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Email</th>
                  <th className="text-left py-2 px-4">Nome</th>
                  <th className="text-left py-2 px-4">Plano</th>
                  <th className="text-left py-2 px-4">Status</th>
                  <th className="text-left py-2 px-4">Data Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="py-2 px-4 text-sm">{user.email}</td>
                    <td className="py-2 px-4 text-sm">{user.nome}</td>
                    <td className="py-2 px-4">
                      <Badge variant={user.plano === "premium" ? "default" : "secondary"}>{user.plano}</Badge>
                    </td>
                    <td className="py-2 px-4">
                      <Badge variant={user.status === "ativo" ? "default" : "secondary"}>{user.status}</Badge>
                    </td>
                    <td className="py-2 px-4 text-sm">{new Date(user.data_cadastro).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
