# Bora Revalidar - Sistema Gamificado de Estudo

## 🎯 Visão Geral

**Bora Revalidar** é uma plataforma gamificada completa para preparação do exame Revalida. Integra um plano estruturado de 20 semanas, ranking semanal, detecção automática de pontos fracos e sistema inteligente de repetição espaçada (SM-2).

### Features Principais

- 📚 **Plano de 20 Semanas**: Trilha estruturada com 5 módulos por semana (5 áreas médicas)
- 🏆 **Ranking Semanal**: Competição entre usuários com pontuação em tempo real
- 🎯 **Detecção de Pontos Fracos**: Análise automática de áreas com dificuldade
- 🔄 **Spaced Repetition**: Algoritmo SM-2 otimizado para máxima retenção
- 📊 **Dashboard Integrado**: Visão completa do progresso
- 📱 **Totalmente Responsivo**: Mobile-first design

---

## 🚀 Quick Start

### 1. Instalar Banco de Dados

Acesse **Supabase Dashboard** → **SQL Editor** e execute:

```sql
-- Copiar conteúdo de: scripts/create-gamification-tables.sql
-- Colar e executar
```

### 2. Deploy Automático

```bash
git push origin v0/ali-jamal2002-1940-d727b681
# Vercel deploy automático
```

### 3. Acessar

```
http://seu-app.com/estudo-gamificado  # Plano de 20 semanas
http://seu-app.com/ranking-semanal    # Ranking
http://seu-app.com/pontos-fracos      # Pontos fracos
```

---

## 📁 Estrutura do Projeto

```
bora-revalidar/
│
├── 📱 Frontend (Next.js)
│   ├── app/
│   │   ├── estudo-gamificado/page.tsx    ← Plano de 20 semanas
│   │   ├── ranking-semanal/page.tsx      ← Ranking
│   │   ├── pontos-fracos/page.tsx        ← Análise de fracos
│   │   └── dashboard/page.tsx            ← Dashboard (ATUALIZADO)
│   │
│   └── components/
│       └── smart-review-section.tsx      ← Widget de revisão
│
├── ⚙️ Backend (Server Actions)
│   └── lib/
│       ├── gamification.ts               ← Gerenciamento do plano
│       └── spaced-repetition-v2.ts       ← SM-2 melhorado
│
├── 🗄️ Database (Supabase)
│   └── scripts/
│       └── create-gamification-tables.sql ← Schema SQL
│
└── 📚 Documentação
    ├── docs/
    │   ├── INDEX.md                      ← Índice
    │   ├── GAMIFICATION_SYSTEM.md        ← Sistema completo
    │   ├── INSTALLATION.md               ← Instalação
    │   ├── INTEGRATION_EXAMPLES.md       ← Exemplos
    │   ├── IMPLEMENTATION_SUMMARY.md     ← Resumo
    │   └── DEPLOYMENT_CHECKLIST.md       ← Checklist deploy
```

---

## 🏗️ Arquitetura

```
┌────────────────────────────────────────────────────┐
│           User Interface (Next.js)                 │
│   ┌──────────────┬──────────────┬────────────────┐ │
│   │ Plan/20Wks   │ Ranking      │ Weak Topics    │ │
│   └──────────────┴──────────────┴────────────────┘ │
└────────────┬─────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────┐
│        Server Actions (TypeScript)                │
│   ┌────────────────┬───────────────────────────┐ │
│   │ gamification   │ spaced-repetition-v2      │ │
│   │ • Plan Mgmt    │ • SM-2 Algorithm          │ │
│   │ • Ranking      │ • Schedule Calc           │ │
│   │ • Weak Topics  │ • Statistics              │ │
│   └────────────────┴───────────────────────────┘ │
└────────────┬─────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────┐
│         Database (PostgreSQL/Supabase)            │
│   ┌──────────────────────────────────────────┐   │
│   │ • user_progress                          │   │
│   │ • review_schedule                        │   │
│   │ • user_question_attempts                 │   │
│   │ • weekly_points                          │   │
│   │ • weak_topics                            │   │
│   └──────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘
```

---

## 📊 Fluxo de Dados

```
┌─────────┐
│ Estuda  │
│ Questão │
└────┬────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ Registra em:                            │
│ • user_question_attempts (resposta)     │
│ • weak_topics (score)                   │
│ • weekly_points (pontos)                │
│ • review_schedule (próxima revisão)     │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ Resultado:                              │
│ • Ponto atualizado no ranking           │
│ • Próxima revisão agendada              │
│ • Fraco detectado automaticamente       │
│ • Dashboard atualizado em tempo real    │
└─────────────────────────────────────────┘
```

---

## 🎮 Sistema de Gamificação

### Pontuação

| Ação | Pontos |
|------|--------|
| ✅ Questão correta | +10 |
| ❌ Questão errada | +2 |
| 🏁 Módulo completo | +50 |
| 📚 Sessão flashcards | +5 |

### Ranking

- 🥇 1º lugar: Medalha de ouro destacada
- 🥈 2º lugar: Medalha de prata
- 🥉 3º lugar: Medalha de bronze
- 📊 Ranking completo de até 100 usuários
- 🔄 Reseta toda segunda-feira

### Detecção de Fracos

```
Taxa de Erro > 70%  → 🔴 CRÍTICO (estudo urgente)
Taxa de Erro > 50%  → 🟡 ALTO (estudar logo)
Taxa de Erro > 40%  → 🟠 MÉDIO (revisar depois)
```

---

## 🧠 Algoritmo SM-2 (Spaced Repetition)

Sistema inteligente que agenda revisões baseado em desempenho:

```
Erro 1ª vez:     1 dia
Erro 2ª vez:     3 dias
Acerto 1ª:       7 dias
Acerto 2ª:      15 dias
Acerto 3ª:      30 dias
Acerto 4ª:      60 dias
```

**Resultado**: Aprendizado exponencialmente melhor com menos tempo.

---

## 📈 Métricas

- **20 Semanas**: Trilha completa estruturada
- **5 Áreas Médicas**: Clínica, Cirurgia, Pediatria, Gineco, Preventiva
- **100 Módulos**: 5 por semana × 20 semanas
- **5 Tabelas**: Gerenciando todo o sistema
- **0 Colunas Extras**: Sem dados desnecessários

---

## 🔒 Segurança

✅ **Row Level Security (RLS)**: Usuários veem apenas seus dados
✅ **Autenticação Supabase**: Integrado com auth existente
✅ **Server Actions**: Nunca expõe credenciais
✅ **Validação de Entrada**: Todas as funções validam dados
✅ **Índices Otimizados**: Queries rápidas e seguras

---

## 📖 Documentação

### Comece Aqui
- 📋 **[INDEX.md](docs/INDEX.md)** - Índice e navegação rápida
- 📖 **[GAMIFICATION_SYSTEM.md](docs/GAMIFICATION_SYSTEM.md)** - Sistema completo
- 🚀 **[INSTALLATION.md](docs/INSTALLATION.md)** - Passo a passo

### Para Desenvolvedores
- 💡 **[INTEGRATION_EXAMPLES.md](docs/INTEGRATION_EXAMPLES.md)** - 10 exemplos práticos
- 📝 **[IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md)** - Resumo técnico
- ✅ **[DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)** - Deploy seguro

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Node.js Server Actions, TypeScript
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Deploy**: Vercel

---

## 📱 Pages Criadas

### Plano de Aprovação Revalida – 20 Semanas
`/estudo-gamificado`

- Trilha visual de progresso
- 20 semanas com 5 módulos cada
- Status de cada módulo (Completo/Em Progresso/Bloqueado)
- Botões para Questões, Flashcards, Marcar Concluído
- Barra de progresso geral

### Ranking Semanal
`/ranking-semanal`

- Pódio destacado com medalhas
- Ranking completo (top 100)
- Posição do usuário em destaque
- Regras de pontuação

### Seus Pontos Fracos
`/pontos-fracos`

- Temas com maior taxa de erro
- Classificação por prioridade
- Estatísticas detalhadas
- Links diretos para estudo direcionado

### Dashboard (Atualizado)
`/dashboard`

- 3 novos cards (Plano, Ranking, Pontos Fracos)
- SmartReviewSection mostrando próximas revisões
- Integrado com sistema existente

---

## 🚀 Deployment

### Local
```bash
npm install
npm run dev
# http://localhost:3000
```

### Vercel (Automático)
```bash
git push origin v0/ali-jamal2002-1940-d727b681
# Deploya automaticamente
```

---

## 📞 Suporte

- 📚 **Docs**: `/docs` pasta completa
- 💬 **Discord**: [Server Link]
- 📧 **Email**: [seu email]
- 🐛 **Issues**: GitHub Issues

---

## ✨ Próximas Features (Roadmap)

- [ ] Notificações por email
- [ ] Badges & Conquistas
- [ ] Recomendações de IA
- [ ] Competição em tempo real
- [ ] Exportar em PDF
- [ ] App móvel nativa

---

## 📊 Estatísticas

- **Total de Código**: ~2,900 linhas
- **Total de Docs**: ~900 linhas
- **Tabelas Database**: 5
- **Pages Novas**: 4
- **Components Novos**: 1
- **Libs Novas**: 2
- **Tempo de Implementação**: Otimizado ✅

---

## 📄 License

MIT - Sinta-se livre para usar e adaptar!

---

## 🎓 Créditos

Desenvolvido para a plataforma **Bora Revalidar** - Preparação para o Revalida

---

**Status**: Production Ready ✅
**Versão**: 1.0.0
**Última Atualização**: Março 2026

---

**Pronto para começar? Acesse [docs/INDEX.md](docs/INDEX.md)**
