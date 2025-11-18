# Bora Revalidar - Documentação Completa

## O que é o Bora Revalidar?

O **Bora Revalidar** é uma plataforma de estudos focada em preparação para provas de revalidação médica (como Revalida). Usa técnicas de repetição espaçada e questões de múltipla escolha para maximizar a retenção de conhecimento.

---

## Como Funciona o App?

### 1. Acesso e Autenticação

#### Processo de Compra e Cadastro

**Passo 1: Pagamento na Cakto**
- Cliente compra o acesso ao Bora Revalidar na plataforma Cakto
- Após confirmação do pagamento, o sistema automaticamente:
  - Registra o email do cliente na tabela `assinaturas`
  - Ativa o status como `ativo`
  - Cliente recebe email com link para o app

**Passo 2: Criar Conta**
- Cliente acessa o app e clica em "Criar Conta"
- Insere email (o mesmo usado no pagamento) e cria uma senha
- Sistema valida se o email tem assinatura ativa
- Se válido: conta é criada e cliente é redirecionado para o dashboard
- Se inválido: mostra mensagem "Assinatura não encontrada"

**Passo 3: Login**
- Cliente faz login com email e senha
- Sistema valida assinatura novamente
- Registra o dispositivo atual e **desconecta automaticamente outros dispositivos**

#### Controle de Dispositivos

**Regra: 1 dispositivo por vez**
- Quando você faz login em um dispositivo novo, o anterior é desconectado automaticamente
- Se estiver estudando e outra pessoa fizer login na sua conta, você será deslogado
- Mensagem exibida: "Sua sessão foi encerrada porque você fez login em outro dispositivo"

Isso garante que:
- Apenas 1 pessoa use a conta por vez
- Previne compartilhamento indevido de acesso
- Protege a segurança do usuário

---

### 2. Funcionalidades Principais

#### Dashboard

Tela inicial que mostra:
- **Total de Cartões**: Número de questões disponíveis
- **Vencidos**: Questões prontas para revisar hoje
- **Revisados Hoje**: Quantas você já estudou
- **Taxa de Acerto**: Seu percentual de acertos geral

Ações rápidas:
- Estudar Agora: Iniciar sessão de estudo
- Novo Simulado: Fazer simulado por tempo
- Ver Progresso: Análise detalhada de desempenho

#### Estudar (Modo Revisão)

**Como Funciona:**
1. Selecione um ou mais temas (Clínica Médica, Cirurgia, Pediatria, etc.)
2. Escolha quantas questões deseja estudar (até 100)
3. Clique em "Iniciar Estudo"

**Durante o Estudo:**
- Lê o enunciado completo da questão
- Vê as 5 alternativas (A, B, C, D, E)
- Clica na alternativa que acha correta
- Sistema mostra se acertou (verde) ou errou (vermelho)
- Exibe a resposta correta
- Clique em "Próxima Questão" para continuar

**Registro:**
- Cada resposta é salva na tabela `hist_questoes`
- Armazena: questão respondida, alternativa escolhida, se acertou/errou, data/hora
- Usado para gerar estatísticas e progresso

#### Simulados

**Como Funciona:**
1. Selecione temas que deseja incluir no simulado
2. Escolha quantidade de questões (5 a 50)
3. Clique em "Iniciar Simulado"

**Durante o Simulado:**
- Interface similar ao estudo, mas com foco em velocidade
- Mostra placar em tempo real: "Acertos: 5 | Erros: 2"
- Ao terminar, exibe resumo completo:
  - Percentual de acerto
  - Questões corretas e incorretas
  - Botão para revisar erros

**Diferença do Estudo:**
- Simulado é mais rápido e focado em performance
- Estudo é para revisão detalhada

#### Revisão e Análise

**3 Abas Principais:**

**1. Visão Geral**
- Cards com estatísticas gerais
- Total de questões respondidas
- Média geral de acerto
- Quantas matérias você já estudou

**2. Progresso por Matéria**
- Tabela com cada tema estudado
- Mostra:
  - Total de questões respondidas
  - Quantas acertou
  - Quantas errou
  - Percentual de acerto
- Barra de progresso visual por tema

**3. Questões Erradas**
- Lista todas as questões que você errou
- Mostra quantas vezes você errou cada uma
- Botão "Responder Novamente" para revisar
- Perfeito para focar em pontos fracos

**Modo Revisar Erradas:**
- Estuda apenas questões que você errou anteriormente
- Interface igual ao estudo normal
- Ideal para melhorar em áreas com dificuldade

---

### 3. Banco de Dados

#### Tabelas Principais

**questoes**
- Armazena todas as questões do banco
- Campos: `enunciado`, `alternativaA` até `alternativaE`, `correta`, `tema`, `dificuldade`
- A coluna `tema` define a matéria (cirurgia, pediatria, etc.)
- A coluna `correta` tem a letra da alternativa correta (A, B, C, D ou E)

**hist_questoes**
- Histórico de todas as respostas do usuário
- Campos: `user_id`, `questao_id`, `resposta`, `correta`, `origem`, `created_at`
- `origem` pode ser "estudo" ou "simulado"
- Usado para gerar todas as estatísticas

**assinaturas**
- Controla quem tem acesso ao app
- Campos: `email`, `nome`, `status`, `data_pagamento`, `transaction_id`
- Status: `ativo` permite login, outros status bloqueiam

**user_devices**
- Controla em qual dispositivo cada usuário está logado
- Campos: `user_id`, `device_id`, `active`, `last_active`
- Apenas 1 registro pode ter `active = true` por usuário

**marcacoes_revisao**
- Permite marcar questões para estudar depois (futuro)
- Campos: `questao_id`, `data_marcacao`, `status`

---

### 4. Algoritmo de Estudo

#### Como Questões São Selecionadas

**Por Tema:**
- Você escolhe os temas que quer estudar
- Sistema busca todas as questões desses temas no Supabase
- Embaralha as questões aleatoriamente
- Limita pela quantidade escolhida (ex: 20 questões)

**Embaralhamento:**
- Cada sessão de estudo/simulado tem ordem aleatória de questões
- Evita memorização por posição
- Garante variedade no estudo

**Alternativas:**
- As alternativas A, B, C, D, E sempre aparecem na ordem correta
- Não são embaralhadas para manter integridade da questão original

---

### 5. Segurança e Controle

#### Validação de Assinatura

**No Cadastro:**
\`\`\`
1. Usuário tenta criar conta com email X
2. Sistema consulta tabela assinaturas
3. Se email X tem status = 'ativo': permite cadastro
4. Se não: mostra "Assinatura não encontrada"
\`\`\`

**No Login:**
\`\`\`
1. Usuário faz login com credenciais
2. Sistema valida email/senha no Supabase Auth
3. Sistema consulta tabela assinaturas
4. Se status ≠ 'ativo': desloga e mostra erro
5. Se status = 'ativo': permite acesso
\`\`\`

#### Controle de Dispositivos

**Fluxo Completo:**
\`\`\`
1. Usuário faz login no Dispositivo A
   - Sistema registra sessão: device_A, active = true
   
2. Usuário faz login no Dispositivo B
   - Sistema desativa sessão anterior: device_A, active = false
   - Sistema registra nova sessão: device_B, active = true
   
3. Usuário A no Dispositivo A tenta acessar página
   - Hook verifica sessão a cada 30 segundos
   - Descobre que active = false
   - Desloga automaticamente e mostra alerta
\`\`\`

**Verificação Periódica:**
- A cada 30 segundos, o app verifica se a sessão ainda está ativa
- Se não estiver, desloga o usuário automaticamente
- Não permite múltiplos dispositivos simultâneos

---

## Integração com Cakto

### Webhook Automático

Quando cliente paga na Cakto:

1. **Cakto envia webhook** para: `https://seu-app.vercel.app/api/cakto/webhook`
2. **Webhook contém:**
   - Email do comprador
   - Nome do comprador
   - ID da transação
   - Status do pagamento

3. **Seu app processa:**
   - Valida assinatura do webhook
   - Cria/ativa registro na tabela `assinaturas`
   - Define status como `ativo`
   - (Opcional) Envia email de boas-vindas

4. **Cliente recebe:**
   - Email com link para o app
   - Instruções de cadastro

### Configuração Necessária

**No Vercel/v0:**
- Adicionar variável: `CAKTO_WEBHOOK_SECRET` (fornecida pela Cakto)

**Na Cakto:**
- Configurar webhook URL
- Ativar evento `payment.approved`

---

## Resumo de Uso do Aluno

1. **Compra acesso** na Cakto
2. **Recebe email** com link
3. **Cria conta** no app com email da compra
4. **Faz login** (desconecta outros dispositivos)
5. **Escolhe temas** para estudar
6. **Responde questões** (A, B, C, D, E)
7. **Vê resultado** imediato (acertou/errou)
8. **Acompanha progresso** na aba Revisão
9. **Revisa erros** para melhorar

---

## Tecnologias Usadas

- **Next.js 16** - Framework React para web
- **Supabase** - Banco de dados PostgreSQL e autenticação
- **TailwindCSS v4** - Estilização
- **Recharts** - Gráficos de progresso
- **Vercel** - Hospedagem

---

## Suporte e Manutenção

### Logs Importantes

**Autenticação:**
\`\`\`
[v0] No active session found
[v0] Login error: ...
[v0] Session terminated on this device
\`\`\`

**Questões:**
\`\`\`
[v0] Total questions fetched: 94
[v0] Questions after theme filter: 11
[v0] Current question: { id, enunciado, correta }
\`\`\`

**Dispositivos:**
\`\`\`
[v0] Deactivated sessions on other devices
[v0] No device ID found
[v0] Session terminated on this device
\`\`\`

### Problemas Comuns

**"Assinatura não encontrada"**
- Email não está na tabela assinaturas
- Status não é 'ativo'
- Solução: Verificar webhook da Cakto ou adicionar manualmente

**"Sessão encerrada em outro dispositivo"**
- Normal quando faz login em dispositivo diferente
- Apenas 1 dispositivo por vez é permitido

**"Nenhuma questão encontrada"**
- Tema selecionado não tem questões no banco
- Verificar se campo `tema` está preenchido corretamente

---

## Roadmap Futuro

- [ ] Adicionar temporizador em simulados
- [ ] Modo offline para questões já baixadas
- [ ] Estatísticas avançadas com IA
- [ ] Comparação com outros estudantes
- [ ] Metas diárias personalizadas
- [ ] Notificações de revisão
- [ ] Export de progresso em PDF
