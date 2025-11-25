"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react"

interface HealthStatus {
  service: string
  status: "healthy" | "unhealthy" | "warning"
  message: string
  responseTime?: number
}

export default function HealthCheckPage() {
  const [health, setHealth] = useState<HealthStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [lastCheck, setLastCheck] = useState<Date>(new Date())

  const checkHealth = async () => {
    setLoading(true)
    const checks: HealthStatus[] = []

    // 1. Check Supabase Connection
    const supabaseStart = Date.now()
    try {
      const response = await fetch("/api/health/supabase")
      const data = await response.json()
      checks.push({
        service: "Supabase Database",
        status: data.healthy ? "healthy" : "unhealthy",
        message: data.message || "Connected",
        responseTime: Date.now() - supabaseStart,
      })
    } catch (error) {
      checks.push({
        service: "Supabase Database",
        status: "unhealthy",
        message: "Connection failed",
        responseTime: Date.now() - supabaseStart,
      })
    }

    // 2. Check Auth Service
    const authStart = Date.now()
    try {
      const response = await fetch("/api/health/auth")
      const data = await response.json()
      checks.push({
        service: "Supabase Auth",
        status: data.healthy ? "healthy" : "unhealthy",
        message: data.message || "Auth service operational",
        responseTime: Date.now() - authStart,
      })
    } catch (error) {
      checks.push({
        service: "Supabase Auth",
        status: "unhealthy",
        message: "Auth service unavailable",
        responseTime: Date.now() - authStart,
      })
    }

    // 3. Check Webhook Endpoint
    const webhookStart = Date.now()
    try {
      const response = await fetch("/api/health/webhook")
      const data = await response.json()
      checks.push({
        service: "Webhook Cakto",
        status: data.healthy ? "healthy" : "unhealthy",
        message: data.message || "Webhook endpoint available",
        responseTime: Date.now() - webhookStart,
      })
    } catch (error) {
      checks.push({
        service: "Webhook Cakto",
        status: "unhealthy",
        message: "Webhook endpoint unavailable",
        responseTime: Date.now() - webhookStart,
      })
    }

    // 4. Check Environment Variables
    checks.push({
      service: "Environment Variables",
      status: checkEnvVars() ? "healthy" : "warning",
      message: checkEnvVars() ? "All variables configured" : "Some variables missing",
    })

    setHealth(checks)
    setLastCheck(new Date())
    setLoading(false)
  }

  const checkEnvVars = () => {
    const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    return requiredVars.every((v) => process.env[v])
  }

  useEffect(() => {
    checkHealth()
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "unhealthy":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800"
      case "unhealthy":
        return "bg-red-100 text-red-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const overallHealth = health.every((h) => h.status === "healthy")
    ? "healthy"
    : health.some((h) => h.status === "unhealthy")
      ? "unhealthy"
      : "warning"

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">System Health Check</h1>
        <p className="text-muted-foreground">Monitoramento em tempo real dos serviços do Bora Revalidar</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Status Geral do Sistema</CardTitle>
              <CardDescription>Última verificação: {lastCheck.toLocaleTimeString("pt-BR")}</CardDescription>
            </div>
            <Button onClick={checkHealth} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {getStatusIcon(overallHealth)}
            <Badge className={getStatusColor(overallHealth)}>
              {overallHealth === "healthy" && "Todos os Serviços Operacionais"}
              {overallHealth === "warning" && "Alguns Serviços com Alertas"}
              {overallHealth === "unhealthy" && "Serviços com Problemas"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {health.map((check, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <h3 className="font-semibold">{check.service}</h3>
                    <p className="text-sm text-muted-foreground">{check.message}</p>
                  </div>
                </div>
                {check.responseTime && <Badge variant="outline">{check.responseTime}ms</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
