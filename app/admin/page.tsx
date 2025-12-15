"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, FileText, CreditCard, TrendingUp, UserCog, ArrowLeft } from "lucide-react"
import { AdminGuard } from "@/components/admin-guard"

export default function AdminDashboard() {
  const adminPages = [
    {
      title: "Gerenciar Explicações",
      description: "Adicionar e editar justificativas das questões",
      icon: FileText,
      href: "/admin/explicacoes",
      color: "text-blue-500",
    },
    {
      title: "Usuários",
      description: "Monitoramento e sincronização de usuários",
      icon: Users,
      href: "/admin/usuarios",
      color: "text-green-500",
    },
    {
      title: "Assinaturas",
      description: "Gerenciar planos e assinaturas",
      icon: CreditCard,
      href: "/admin/assinaturas",
      color: "text-purple-500",
    },
    {
      title: "Diagnóstico",
      description: "Análise de desempenho do sistema",
      icon: TrendingUp,
      href: "/admin/diagnostico",
      color: "text-orange-500",
    },
    {
      title: "Upgrade Usuário",
      description: "Atualizar plano de usuários",
      icon: UserCog,
      href: "/admin/upgrade-user",
      color: "text-pink-500",
    },
  ]

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
              <p className="text-muted-foreground">Gerencie questões, usuários e assinaturas</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminPages.map((page) => {
              const Icon = page.icon
              return (
                <Link key={page.href} href={page.href}>
                  <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Icon className={`w-8 h-8 ${page.color}`} />
                      </div>
                      <CardTitle className="text-xl">{page.title}</CardTitle>
                      <CardDescription>{page.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" className="w-full">
                        Acessar →
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          <Card className="mt-8 border-yellow-500/50 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-yellow-600">⚠️ Área Administrativa</CardTitle>
              <CardDescription>
                Esta área contém ferramentas sensíveis. Certifique-se de ter as permissões adequadas antes de fazer
                alterações.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </AdminGuard>
  )
}
