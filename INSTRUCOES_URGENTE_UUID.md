# 🚨 CORREÇÃO URGENTE - Simulado em Grupo

## Problema
O simulado em grupo não está iniciando devido ao erro:
```
invalid input syntax for type integer: "UUID"
```

Isso acontece porque as colunas `question_pk` foram criadas como INTEGER, mas o código usa UUIDs (os IDs reais das questões do banco).

## Solução

### Passo 1: Executar o SQL de Correção

1. Abra o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto "Bora Revalidar"
3. No menu lateral, clique em **"SQL Editor"**
4. Clique em **"New Query"**
5. Copie TODO o conteúdo do arquivo `scripts/FIX_URGENTE_alter_uuid.sql`
6. Cole no editor SQL
7. Clique no botão **"Run"** (ou pressione Cmd+Enter / Ctrl+Enter)

### Passo 2: Verificar se funcionou

Execute este SQL de verificação:
```sql
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('group_study_room_questions', 'group_study_answers') 
  AND column_name = 'question_pk';
```

**Resultado esperado:**
```
table_name                      | column_name  | data_type
--------------------------------|--------------|----------
group_study_room_questions      | question_pk  | uuid
group_study_answers             | question_pk  | uuid
```

### Passo 3: Testar o Simulado

Após executar o SQL com sucesso:

1. Recarregue a página do app (F5)
2. Vá em "Estudo em Grupo"
3. Clique em "Criar Sala"
4. Configure a quantidade de questões
5. Clique em "Criar Sala"
6. **Agora o código da sala deve aparecer!**
7. Clique em "Iniciar Simulado"
8. **Deve funcionar sem erros!**

## Por que isso aconteceu?

O script SQL inicial foi criado com `question_pk INTEGER` mas o sistema usa UUIDs para identificar questões. Esta correção altera o tipo de INTEGER para UUID em ambas as tabelas relacionadas.

## Precisa de Ajuda?

Se ainda houver erro após executar o SQL, compartilhe a mensagem de erro completa.
