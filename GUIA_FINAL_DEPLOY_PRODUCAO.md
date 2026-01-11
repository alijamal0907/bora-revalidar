# 🚀 GUIA DEFINITIVO: Deploy do Estudo em Grupo para Produção

## ✅ CHECKLIST COMPLETO

### PASSO 1: Configurar Banco de Dados de Produção

1. **Acesse o Supabase Dashboard de PRODUÇÃO**
   - Vá para: https://supabase.com/dashboard
   - Selecione o projeto de PRODUÇÃO (não o de desenvolvimento)

2. **Execute o Script SQL**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New Query"
   - Cole TODO o conteúdo do arquivo `FINAL_PRODUCAO_COMPLETO.sql`
   - Clique em "RUN" para executar
   - **IMPORTANTE**: Verifique se TODAS as queries foram executadas com sucesso
   - Você deve ver mensagens de sucesso para cada comando

3. **Verificar Tabelas Criadas**
   - No menu lateral, clique em "Table Editor"
   - Você deve ver 5 novas tabelas:
     - `group_study_rooms`
     - `group_study_participants`
     - `group_study_room_questions`
     - `group_study_answers`
     - `group_study_chat`

4. **Verificar Realtime Habilitado**
   - No menu lateral, clique em "Database" > "Replication"
   - Na seção "supabase_realtime", você deve ver as 5 tabelas listadas
   - Se não estiverem, execute manualmente:
     ```sql
     ALTER PUBLICATION supabase_realtime ADD TABLE group_study_rooms;
     ALTER PUBLICATION supabase_realtime ADD TABLE group_study_participants;
     ALTER PUBLICATION supabase_realtime ADD TABLE group_study_room_questions;
     ALTER PUBLICATION supabase_realtime ADD TABLE group_study_answers;
     ALTER PUBLICATION supabase_realtime ADD TABLE group_study_chat;
     ```

### PASSO 2: Verificar Variáveis de Ambiente

1. **No v0 Chat**
   - Na barra lateral esquerda, clique em "Vars"
   - Verifique se existem:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
   - Essas variáveis devem apontar para o Supabase de PRODUÇÃO

2. **Se as variáveis estiverem erradas**
   - Vá para Supabase Dashboard > Settings > API
   - Copie a "Project URL" e a "anon public key"
   - Atualize as variáveis no v0

### PASSO 3: Fazer Deploy do Código

1. **No v0 Chat**
   - Clique no botão "Publish" no canto superior direito
   - Aguarde o deploy ser concluído
   - Você verá uma URL de produção (algo como: https://seu-projeto.vercel.app)

2. **IMPORTANTE: Limpar Cache**
   - Após o deploy, abra o app em produção
   - Pressione `Ctrl + Shift + R` (Windows/Linux) ou `Cmd + Shift + R` (Mac)
   - Isso força o navegador a recarregar sem cache

### PASSO 4: Testar em Produção

1. **Teste Criar Sala**
   - Acesse a URL de produção
   - Faça login com sua conta (ali_jamal2002@hotmail.com)
   - Vá para "Estudo em Grupo"
   - Clique em "Criar Sala"
   - Selecione 25 questões
   - Clique em "Criar Sala"
   - Você deve ser redirecionado para a sala

2. **Teste Identificação de Host**
   - Você deve ver o botão "Iniciar Simulado" (você é o host)
   - Copie o código da sala (ex: ABC123)

3. **Teste Entrar em Sala (outro dispositivo)**
   - Em outro celular/computador, acesse a URL de produção
   - Faça login com outra conta
   - Vá para "Estudo em Grupo"
   - Clique em "Entrar em Sala"
   - Digite o código da sala
   - Você deve entrar na sala
   - Você NÃO deve ver o botão "Iniciar Simulado" (não é host)

4. **Teste Chat e Realtime**
   - Com dois dispositivos na mesma sala
   - Envie mensagens no chat
   - As mensagens devem aparecer instantaneamente em todos os dispositivos

5. **Teste Iniciar Simulado**
   - No dispositivo do host, clique em "Iniciar Simulado"
   - O simulado deve iniciar para TODOS os participantes simultaneamente
   - As questões devem aparecer com enunciado e alternativas

## 🔍 TROUBLESHOOTING

### Erro: "new row violates row-level security policy"
**Solução**: Execute novamente a seção de políticas RLS do script SQL

### Erro: "relation group_study_rooms does not exist"
**Solução**: Execute novamente a seção de criação de tabelas do script SQL

### Botão "Iniciar Simulado" não aparece para o host
**Solução**: 
1. Verifique se fez login com a conta que criou a sala
2. Limpe o cache do navegador (Ctrl + Shift + R)
3. Verifique os logs do console do navegador (F12)

### Chat não atualiza em tempo real
**Solução**:
1. Verifique se o Realtime está habilitado (Passo 1, item 4)
2. Verifique se a tabela `group_study_chat` está na replicação

### Questões não aparecem (só alternativas vazias)
**Solução**: As questões têm colunas `alternativaA`, `alternativaB`, etc. Verifique se sua tabela `questoes` está correta

## ✨ FUNCIONALIDADES CONFIRMADAS

Após seguir todos os passos, você terá:

- ✅ Criação de salas (apenas Premium)
- ✅ Entrada em salas por código
- ✅ Host identificado automaticamente por email
- ✅ Botão "Iniciar Simulado" apenas para host
- ✅ Chat em tempo real
- ✅ Participantes atualizando em tempo real
- ✅ Limite de 10 pessoas por sala
- ✅ Início simultâneo para todos
- ✅ Questões com enunciado e alternativas
- ✅ Sistema de respostas sem mostrar correção durante simulado
- ✅ Ranking ao final
- ✅ Sala deletada automaticamente após finalizar

## 📞 SUPORTE

Se após seguir TODOS os passos ainda não funcionar:
1. Tire prints do SQL Editor mostrando o resultado da execução
2. Tire prints do console do navegador (F12) mostrando os erros
3. Verifique se está testando na URL de produção (não localhost)
4. Confirme que fez o deploy do código (botão "Publish")
