# 📊 GUIA DE MONITORAMENTO EM PRODUÇÃO

## Dashboards Principais

### 1. Vercel Analytics
**URL:** https://vercel.com/dashboard/analytics

**Métricas para Monitorar:**
- **Visitors:** Número de visitantes únicos
- **Page Views:** Total de visualizações de página
- **Top Pages:** Páginas mais acessadas
- **Real User Monitoring (RUM):**
  - Time to First Byte (TTFB): Deve ser < 600ms
  - First Contentful Paint (FCP): Deve ser < 1.8s
  - Largest Contentful Paint (LCP): Deve ser < 2.5s

### 2. Supabase Dashboard
**URL:** https://supabase.com/dashboard/project/fmhzwcbjjdkcylohqfyy

**Seções Críticas:**

#### Reports (Relatórios)
- **Database Health:** CPU, Memória, Conexões
- **API Usage:** Requisições por endpoint
- **Auth Activity:** Logins, signups, erros

#### Logs
- **Auth Logs:** Erros de autenticação
- **Database Logs:** Queries lentas (> 1s)
- **API Logs:** Erros 4xx/5xx

### 3. Health Check Interno
**URL:** https://seu-app.vercel.app/admin/health-check

**Verifica:**
- Conexão com Supabase
- Serviço de Auth
- Webhook Cakto
- Variáveis de ambiente

## Alertas Configurados

### Supabase Email Alerts
- Database CPU > 80% por 5 minutos
- Database Memory > 80%
- Storage > 80% de uso
- Taxa de erro > 5% em 15 minutos

### Vercel Notifications
- Deploy com erro
- Build failure
- Alta taxa de erros (> 1% de requisições)

## Queries Úteis para Monitoramento

### Verificar Cadastros Recentes
\`\`\`sql
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN plano = 'free' THEN 1 END) as usuarios_free,
  COUNT(CASE WHEN plano = 'premium' THEN 1 END) as usuarios_premium
FROM assinaturas
WHERE data_cadastro >= CURRENT_DATE - INTERVAL '7 days';
\`\`\`

### Verificar Atividade de Estudo
\`\`\`sql
SELECT 
  COUNT(DISTINCT user_id) as usuarios_ativos,
  COUNT(*) as total_questoes_respondidas,
  AVG(CASE WHEN acertou THEN 1.0 ELSE 0.0 END) * 100 as taxa_acerto
FROM hist_questoes
WHERE data_resposta >= CURRENT_DATE - INTERVAL '24 hours';
\`\`\`

### Verificar Conversão FREE → PREMIUM
\`\`\`sql
SELECT 
  COUNT(CASE WHEN plano = 'premium' AND transaction_id IS NOT NULL THEN 1 END) as conversoes,
  COUNT(CASE WHEN plano = 'free' THEN 1 END) as usuarios_free,
  ROUND(
    COUNT(CASE WHEN plano = 'premium' AND transaction_id IS NOT NULL THEN 1 END)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as taxa_conversao_pct
FROM assinaturas;
\`\`\`

### Identificar Queries Lentas
\`\`\`sql
SELECT 
  query,
  calls,
  total_exec_time / 1000 as total_seconds,
  mean_exec_time / 1000 as mean_seconds,
  max_exec_time / 1000 as max_seconds
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- Queries com média > 1 segundo
ORDER BY mean_exec_time DESC
LIMIT 10;
\`\`\`

## Rotina de Monitoramento

### Diária (Primeiros 7 Dias)
- [ ] Verificar health check
- [ ] Revisar logs de erro no Supabase
- [ ] Verificar taxa de cadastros
- [ ] Verificar taxa de conversão
- [ ] Responder feedbacks de usuários

### Semanal (Após Estabilização)
- [ ] Analisar métricas de performance (Vercel)
- [ ] Verificar uso do banco de dados
- [ ] Revisar queries lentas
- [ ] Atualizar documentação se necessário
- [ ] Backup manual adicional

### Mensal
- [ ] Auditoria completa de segurança
- [ ] Análise de custos (Vercel + Supabase)
- [ ] Planejamento de otimizações
- [ ] Atualização de dependências
- [ ] Teste de recuperação de backup

## Limites e Thresholds

### Banco de Dados
- ⚠️ Warning: CPU > 70%
- 🚨 Critical: CPU > 85%
- ⚠️ Warning: Memory > 75%
- 🚨 Critical: Memory > 90%

### API Performance
- ⚠️ Warning: Response time > 1s
- 🚨 Critical: Response time > 3s
- ⚠️ Warning: Error rate > 1%
- 🚨 Critical: Error rate > 5%

### Usuários
- ⚠️ Warning: Taxa de erro de login > 10%
- 🚨 Critical: Taxa de erro de login > 25%
- ⚠️ Warning: Usuários ativos caiu > 20%
- 🚨 Critical: Usuários ativos caiu > 50%

## Ações em Caso de Alerta

### Database CPU Alto
1. Identificar queries lentas no pg_stat_statements
2. Adicionar índices se necessário
3. Otimizar queries problemáticas
4. Considerar upgrade de plano se persistir

### Alta Taxa de Erros
1. Verificar logs no Supabase e Vercel
2. Identificar endpoint/função com problema
3. Deploy de hotfix se necessário
4. Comunicar usuários se for downtime prolongado

### Webhook Cakto Falhando
1. Verificar logs do endpoint /api/webhook-cakto
2. Testar manualmente com curl
3. Verificar CAKTO_WEBHOOK_SECRET
4. Contatar suporte Cakto se persistir
