# Instruções para Gerar Explicações das Questões

## Situação Atual

Você adicionou explicações em todas as questões. Este script vai **analisar** quais questões ainda estão sem explicação (se houver) e mostrar um template seguindo o modelo obrigatório.

## Como Usar o Script

### 1. Configurar Variáveis de Ambiente

Certifique-se de que você tem as seguintes variáveis no seu `.env.local`:

\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
\`\`\`

### 2. Executar o Script

\`\`\`bash
cd scripts
npm install
npm run generate-explicacoes
\`\`\`

### 3. O Script Vai:

1. **Contar** quantas questões têm explicação e quantas não têm
2. **Mostrar** um exemplo de explicação existente (para referência)
3. **Listar** as primeiras 5 questões sem explicação com:
   - Enunciado completo
   - Todas as alternativas
   - Resposta correta
   - Template de explicação seguindo o modelo obrigatório

### 4. Modelo Obrigatório (já implementado no script)

O script gera explicações seguindo EXATAMENTE este formato:

\`\`\`
A alternativa X é a correta porque [explicação do raciocínio clínico, destacando achados-chave do enunciado e conectando com diretrizes].

As demais alternativas estão incorretas porque:
- A: [explicação breve do erro]
- B: [explicação breve do erro]
- C: [explicação breve do erro]
- D: [explicação breve do erro]
- E: [explicação breve do erro]

Portanto, a conduta correta é a alternativa X.
\`\`\`

## Estilo do Texto

- ✅ Claro, objetivo e didático
- ✅ "Mini-aula", mas sem parágrafos enormes
- ✅ Focado em raciocínio clínico e padrão Revalida
- ✅ Sem jargões desnecessários
- ✅ Sem inventar dados que não estão no enunciado

## Próximos Passos Após Executar o Script

### Opção 1: Usar a Página Administrativa (RECOMENDADO)

1. Acesse `/admin/explicacoes` no seu app
2. Veja a lista de questões sem explicação
3. Clique em "Gerar Explicação" para cada questão
4. Revise e edite o texto gerado
5. Salve diretamente no banco de dados

### Opção 2: Atualizar Manualmente via SQL

Se preferir, copie o template gerado e crie updates SQL:

\`\`\`sql
UPDATE questoes 
SET explicacao = 'A alternativa A é a correta porque...'
WHERE id = 'id_da_questao';
\`\`\`

## Verificar Progresso

Execute este SQL no Supabase para ver quantas questões ainda faltam:

\`\`\`sql
SELECT 
  COUNT(*) as total,
  COUNT(explicacao) FILTER (WHERE LENGTH(TRIM(explicacao)) > 0) as com_explicacao,
  COUNT(*) - COUNT(explicacao) FILTER (WHERE LENGTH(TRIM(explicacao)) > 0) as sem_explicacao
FROM questoes;
\`\`\`

## Observações Importantes

- ⚠️ O script NÃO atualiza o banco automaticamente
- ⚠️ Ele apenas ANALISA e MOSTRA templates para você revisar
- ⚠️ Você precisa preencher os templates com análise clínica real
- ✅ As explicações devem ser escritas por profissionais de saúde
- ✅ O modelo obrigatório já está implementado no template
