# Checklist de Deployment - Sistema Gamificado

## Pré-Deployment (Local)

### Code Review
- [ ] Todos os arquivos novos têm comentários
- [ ] Sem console.log() de debug (apenas `[v0]` format)
- [ ] Sem TODOs pendentes
- [ ] TypeScript sem erros (`npm run lint`)
- [ ] Imports organizados e sem duplicatas

### Testing Local
- [ ] Dashboard acessível
- [ ] Plano de 20 semanas carrega
- [ ] Ranking exibe usuários
- [ ] Pontos fracos carrega (vazio é ok)
- [ ] SmartReviewSection no dashboard
- [ ] Sem erros no console

### Database
- [ ] Script SQL revisado
- [ ] Todas as 5 tabelas presentes
- [ ] RLS policies criadas
- [ ] Índices otimizados
- [ ] Triggers funcionando

---

## Deployment (Vercel)

### Preparação
- [ ] Branch `v0/ali-jamal2002-1940-d727b681` atualizado
- [ ] `.env` local replicado em Vercel Settings
- [ ] Build sem erros: `npm run build`
- [ ] Preview deployment bem-sucedido

### GitHub
- [ ] Commit com mensagem clara
- [ ] Push para branch v0
- [ ] PR criado (se necessário)
- [ ] Code review aprovado

### Vercel
- [ ] Environment variables verificadas
- [ ] Build command: `next build` ✓
- [ ] Start command: `next start` ✓
- [ ] Root directory: `.` ✓
- [ ] Install command: `npm install` ✓

### Deploy
- [ ] Verificar build logs
- [ ] Sem warnings críticos
- [ ] Deployment time < 5 min
- [ ] Preview URL funcional

---

## Pós-Deployment (Staging)

### URL Staging
- [ ] Acessível em https://vercel-project.vercel.app
- [ ] HTTPS funciona
- [ ] Redirecionamentos corretos

### Funcionalidade
- [ ] Login/logout funciona
- [ ] Dashboard carrega
- [ ] 3 cards novos visíveis
- [ ] Plano carrega sem erro 404
- [ ] Ranking acessível
- [ ] Pontos fracos acessível
- [ ] SmartReviewSection exibe

### Banco de Dados
- [ ] Conexão ao Supabase OK
- [ ] RLS não bloqueia usuário
- [ ] Queries rápidas (< 1s)
- [ ] Sem erros de timeout

### Performance
- [ ] Lighthouse score > 80
- [ ] First Contentful Paint < 2s
- [ ] Sem memory leaks (DevTools)
- [ ] Mobile responsivo

---

## Pós-Deployment (Produção)

### Acesso
- [ ] App acessível em URL pública
- [ ] Certificado SSL válido
- [ ] Sem mixed content warnings

### Dados
- [ ] Usuários reais podem acessar
- [ ] Plano inicializa automático
- [ ] Pontos registram corretamente
- [ ] Sem data corruption

### Monitoramento
- [ ] Sentry/LogRocket ativo (se configurado)
- [ ] Uptime monitor em place
- [ ] Alertas configurados
- [ ] Logs sendo coletados

### Usuários
- [ ] Sem relatos de bugs críticos
- [ ] Ranking funciona em tempo real
- [ ] Respostas registram rapidamente
- [ ] UI responsivo em mobile

---

## Rollback Plan

Se algo der errado, seguir este processo:

### Identificar Problema
```bash
# Ver logs do Vercel
vercel logs --prod

# Ou via Supabase
SELECT * FROM postgres_logs LIMIT 10;
```

### Reverter Código
```bash
# Se o problema é o código
git revert HEAD
git push origin main

# Vercel automaticamente redeploya
```

### Reverter Database
```sql
-- Se tabelas corrompidas
-- NÃO APAGAR, fazer backup antes
SELECT * FROM user_progress LIMIT 1;

-- Contatar admin do Supabase
-- Restaurar backup se necessário
```

### Comunicar Usuários
- [ ] Post no Discord informando downtime
- [ ] Email para usuários premium
- [ ] Status page atualizado
- [ ] ETA de correção comunicado

---

## Verificação de Funcionalidades (Post-Deploy)

### Plano de 20 Semanas
```
Semana 1: [ ] Desbloqueada
Semana 2: [ ] Bloqueada
Módulos: [ ] 5 por semana (25 total)
Status:  [ ] Mostra corretamente (Completo/Em Progresso/Bloqueado)
Botões:  [ ] Questões, Flashcards, Marcar Completo
```

### Ranking Semanal
```
Layout:  [ ] Pódio em destaque (1º maior)
Top 3:   [ ] Medalhas (🥇🥈🥉)
Ranking: [ ] Até 100 usuários
Posição: [ ] Usuário vê sua posição
Pontos:  [ ] Cor/estilo destacado
```

### Pontos Fracos
```
Carregamento: [ ] Rápido (< 2s)
Vazio:        [ ] Mostra mensagem "nenhum fraco detectado"
Com dados:    [ ] Mostra lista com taxa de erro
Prioridade:   [ ] Cores diferenciadas (🔴🟡🟠)
Ações:        [ ] Links para treinar funcionam
```

### Dashboard
```
Cards:       [ ] 3 novos cards visíveis
SmartReview: [ ] Mostra "0 para revisar"
Integração:  [ ] Sem conflitar com elementos antigos
Mobile:      [ ] Layout responsivo
```

---

## Monitoramento Contínuo (Pós-Deploy)

### Daily Check (Diariamente por 1 semana)
- [ ] Nenhum erro 500
- [ ] Database queries < 1s
- [ ] Usuários conseguem completar módulos
- [ ] Ranking atualiza

### Weekly Check (Semana 2+)
- [ ] Taxa de engajamento OK
- [ ] Sem reclamações de bugs
- [ ] Performance mantida
- [ ] RLS funcionando

### Monthly Check (Mês 1+)
- [ ] Dados consistentes
- [ ] Backup feito
- [ ] Índices otimizados
- [ ] Sem data corruption

---

## Documentação Deployment

### Notificar Equipe
- [ ] Slack/Discord #deployments
- [ ] Changelog atualizado
- [ ] Wiki/Docs atualizados
- [ ] Codeowners notificados

### Métricas
- [ ] Coletar baseline de performance
- [ ] Monitorar erros por dia
- [ ] Engagement por feature
- [ ] User retention

---

## Contingency Plan

### Se Supabase ficar down
```bash
# Ainda é possível:
- View app em modo offline (PWA)
- Redirecionar tráfego se tiver replica

# Não é possível:
- Sincronizar dados novos
- Acessar banco
- Update progresso
```

### Se Vercel ficar down
```bash
# Alternativas:
- Usar domínio DNS alternativo (se configurado)
- Deploy em GitHub Pages (com limitations)
- Alertar usuários

# Tempo esperado de recuperação: < 15 min
```

---

## Sign-Off

- [ ] **Frontend Lead**: Code review ✅
- [ ] **Backend Lead**: Database review ✅
- [ ] **DevOps/Infra**: Deployment OK ✅
- [ ] **QA**: Testes passaram ✅
- [ ] **Product Manager**: Feature approve ✅

---

## Final Checklist

```bash
# 1. Build
npm run build

# 2. Test
npm run test  # Se houver

# 3. Lint
npm run lint

# 4. Push
git push origin v0/ali-jamal2002-1940-d727b681

# 5. Deploy (Vercel faz automaticamente)

# 6. Verify
# - Acessar URL
# - Testar principais funcionalidades
# - Checar console (F12) para erros
```

---

**Status**: Pronto para Deploy ✅
**Data**: Março 2026
**Versão**: 1.0.0
