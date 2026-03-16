"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, Database, AlertTriangle, Copy } from "lucide-react"
import Link from "next/link"

interface TableStatus {
  name: string
  exists: boolean
  checked: boolean
}

const SQL_SCRIPT = `-- ============================================
-- SISTEMA DE GAMIFICACAO - BORA REVALIDAR
-- ============================================

-- 1. Tabela de Progresso do Usuario (Plano de 20 Semanas)
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_number INTEGER NOT NULL,
  area_name VARCHAR NOT NULL,
  subtopic_name VARCHAR NOT NULL,
  status_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, week_number, area_name),
  CHECK (week_number >= 1 AND week_number <= 20)
);

-- 2. Tabela de Agendamento de Revisao (Spaced Repetition)
CREATE TABLE IF NOT EXISTS review_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type VARCHAR NOT NULL CHECK (content_type IN ('questao', 'flashcard')),
  content_id VARCHAR NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  next_review TIMESTAMP WITH TIME ZONE DEFAULT now(),
  interval_days INTEGER DEFAULT 1,
  ease_factor DECIMAL DEFAULT 2.5,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, content_type, content_id)
);

-- 3. Tabela de Registro de Respostas do Usuario
CREATE TABLE IF NOT EXISTS user_question_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id VARCHAR NOT NULL,
  subtema VARCHAR NOT NULL,
  area_name VARCHAR NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabela de Pontos Semanais (Ranking)
CREATE TABLE IF NOT EXISTS weekly_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, week_start_date)
);

-- 5. Tabela de Temas Fracos (Weak Topics)
CREATE TABLE IF NOT EXISTS weak_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subtema VARCHAR NOT NULL,
  area_name VARCHAR NOT NULL,
  error_rate DECIMAL NOT NULL,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  correct_attempts INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, subtema)
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_week ON user_progress(user_id, week_number);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(user_id, status_completed);
CREATE INDEX IF NOT EXISTS idx_review_schedule_user_next ON review_schedule(user_id, next_review);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON user_question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user_subtema ON user_question_attempts(user_id, subtema);
CREATE INDEX IF NOT EXISTS idx_weekly_points_user_week ON weekly_points(user_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_weak_topics_user ON weak_topics(user_id, error_rate DESC);

-- RLS (Row Level Security)
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE weak_topics ENABLE ROW LEVEL SECURITY;

-- Politicas de seguranca para user_progress
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);

-- Politicas para review_schedule
DROP POLICY IF EXISTS "Users can view own reviews" ON review_schedule;
CREATE POLICY "Users can view own reviews" ON review_schedule FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own reviews" ON review_schedule;
CREATE POLICY "Users can insert own reviews" ON review_schedule FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own reviews" ON review_schedule;
CREATE POLICY "Users can update own reviews" ON review_schedule FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own reviews" ON review_schedule;
CREATE POLICY "Users can delete own reviews" ON review_schedule FOR DELETE USING (auth.uid() = user_id);

-- Politicas para user_question_attempts
DROP POLICY IF EXISTS "Users can view own attempts" ON user_question_attempts;
CREATE POLICY "Users can view own attempts" ON user_question_attempts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own attempts" ON user_question_attempts;
CREATE POLICY "Users can insert own attempts" ON user_question_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politicas para weekly_points (todos podem ver para ranking)
DROP POLICY IF EXISTS "Anyone can view points" ON weekly_points;
CREATE POLICY "Anyone can view points" ON weekly_points FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own points" ON weekly_points;
CREATE POLICY "Users can insert own points" ON weekly_points FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own points" ON weekly_points;
CREATE POLICY "Users can update own points" ON weekly_points FOR UPDATE USING (auth.uid() = user_id);

-- Politicas para weak_topics
DROP POLICY IF EXISTS "Users can view own weak topics" ON weak_topics;
CREATE POLICY "Users can view own weak topics" ON weak_topics FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own weak topics" ON weak_topics;
CREATE POLICY "Users can insert own weak topics" ON weak_topics FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own weak topics" ON weak_topics;
CREATE POLICY "Users can update own weak topics" ON weak_topics FOR UPDATE USING (auth.uid() = user_id);
`

export default function SetupGamificationPage() {
  const [tables, setTables] = useState<TableStatus[]>([
    { name: "user_progress", exists: false, checked: false },
    { name: "review_schedule", exists: false, checked: false },
    { name: "user_question_attempts", exists: false, checked: false },
    { name: "weekly_points", exists: false, checked: false },
    { name: "weak_topics", exists: false, checked: false },
  ])
  const [checking, setChecking] = useState(false)
  const [copied, setCopied] = useState(false)

  const checkTables = async () => {
    setChecking(true)
    
    try {
      const response = await fetch("/api/setup-gamification")
      const data = await response.json()
      
      if (data.tables) {
        setTables(prev => prev.map(t => ({
          ...t,
          exists: data.tables[t.name] || false,
          checked: true
        })))
      }
    } catch (error) {
      console.error("Erro ao verificar tabelas:", error)
    } finally {
      setChecking(false)
    }
  }

  const copySQL = () => {
    navigator.clipboard.writeText(SQL_SCRIPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const allTablesExist = tables.every(t => t.exists) && tables.some(t => t.checked)
  const someChecked = tables.some(t => t.checked)

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Setup do Sistema de Gamificacao</h1>
            <p className="text-muted-foreground mt-1">
              Configure as tabelas necessarias para o sistema de estudo gamificado
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Voltar ao Dashboard</Button>
          </Link>
        </div>

        {/* Status das Tabelas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Status das Tabelas
            </CardTitle>
            <CardDescription>
              Verifique se todas as tabelas necessarias estao criadas no banco de dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {tables.map((table) => (
                <div 
                  key={table.name}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <span className="font-mono text-sm">{table.name}</span>
                  {!table.checked ? (
                    <span className="text-muted-foreground text-sm">Nao verificado</span>
                  ) : table.exists ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Existe</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm">Nao existe</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button 
              onClick={checkTables} 
              disabled={checking}
              className="w-full"
            >
              {checking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar Tabelas"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        {someChecked && (
          allTablesExist ? (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Setup Completo!</AlertTitle>
              <AlertDescription className="text-green-700">
                Todas as tabelas de gamificacao estao configuradas. Voce ja pode usar o sistema.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-amber-500 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Tabelas Faltando</AlertTitle>
              <AlertDescription className="text-amber-700">
                Algumas tabelas ainda precisam ser criadas. Siga as instrucoes abaixo.
              </AlertDescription>
            </Alert>
          )
        )}

        {/* Instrucoes */}
        <Card>
          <CardHeader>
            <CardTitle>Instrucoes de Instalacao</CardTitle>
            <CardDescription>
              Siga os passos abaixo para criar as tabelas no Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>
                Acesse o <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary underline">Supabase Dashboard</a>
              </li>
              <li>Selecione seu projeto</li>
              <li>Va para <strong>SQL Editor</strong> no menu lateral</li>
              <li>Clique em <strong>New Query</strong></li>
              <li>Cole o SQL abaixo e clique em <strong>Run</strong></li>
              <li>Volte aqui e clique em &quot;Verificar Tabelas&quot;</li>
            </ol>

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 z-10"
                onClick={copySQL}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? "Copiado!" : "Copiar SQL"}
              </Button>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs max-h-96 overflow-y-auto">
                {SQL_SCRIPT}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Links Rapidos */}
        {allTablesExist && (
          <Card>
            <CardHeader>
              <CardTitle>Proximo Passo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/estudo-gamificado">
                <Button className="w-full">Acessar Plano de 20 Semanas</Button>
              </Link>
              <Link href="/ranking-semanal">
                <Button variant="outline" className="w-full">Ver Ranking Semanal</Button>
              </Link>
              <Link href="/pontos-fracos">
                <Button variant="outline" className="w-full">Ver Pontos Fracos</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
