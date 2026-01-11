# 🚨 CORREÇÃO URGENTE - POLÍTICAS RLS

## O PROBLEMA

Você está recebendo o erro:
```
new row violates row-level security policy for table "group_study_rooms"
```

Isso significa que o Supabase está **bloqueando** a criação de salas porque faltam as **políticas de segurança RLS**.

---

## SOLUÇÃO IMEDIATA

### Passo 1: Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto de **PRODUÇÃO**
3. No menu lateral, clique em **"SQL Editor"**

### Passo 2: Executar o Script

1. Cole **TODO** o conteúdo do arquivo `scripts/FIX_RLS_POLICIES_GROUP_STUDY.sql`
2. Clique em **"Run"** (botão verde no canto inferior direito)
3. Aguarde a mensagem de sucesso

### Passo 3: Verificar

Execute esta query para confirmar que as políticas foram criadas:

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'group_study%'
ORDER BY tablename;
```

Você deve ver algo como:

```
tablename                      | policyname
-------------------------------|---------------------------
group_study_answers           | Permitir criar resposta
group_study_answers           | Permitir ler respostas
group_study_chat              | Permitir enviar mensagem
group_study_chat              | Permitir ler mensagens
group_study_participants      | Permitir adicionar participante
group_study_participants      | Permitir ler participantes
group_study_room_questions    | Permitir criar questão da sala
group_study_room_questions    | Permitir ler questões da sala
group_study_rooms             | Permitir criar sala
group_study_rooms             | Permitir ler sala
group_study_rooms             | Permitir atualizar sala
```

---

## O QUE ESSAS POLÍTICAS FAZEM

1. **Criar Sala**: Qualquer usuário autenticado pode criar uma sala ✅
2. **Ver Salas**: Necessário para entrar com código ✅
3. **Atualizar Sala**: Apenas o host pode iniciar o simulado ✅
4. **Participantes**: Usuários podem entrar em salas ✅
5. **Questões**: Host adiciona, participantes leem ✅
6. **Respostas**: Cada usuário salva suas próprias respostas ✅
7. **Chat**: Participantes podem conversar ✅

---

## APÓS EXECUTAR

1. **NÃO** precisa fazer novo deploy
2. Teste criando uma nova sala no app
3. Deve funcionar imediatamente em todos os dispositivos

---

## SE AINDA NÃO FUNCIONAR

Verifique se o usuário está autenticado:

```sql
SELECT auth.uid();
```

Se retornar `null`, o problema é de autenticação, não de RLS.
