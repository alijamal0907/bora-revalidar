# Guia de Gerenciamento de Explicações de Questões

## Visão Geral

O sistema agora possui uma página administrativa para gerenciar explicações de questões do Revalida que ainda não possuem justificativa.

## Como Usar

### 1. Acessar a Página de Explicações

Acesse: `/admin/explicacoes`

A página irá carregar automaticamente as primeiras 50 questões sem explicação.

### 2. Gerar Explicação com IA

Para cada questão, você pode:

1. **Clicar em "Gerar com IA"**: O sistema usa GPT-4 para gerar uma justificativa seguindo o modelo padrão do Revalida
2. **Editar manualmente**: Você pode ajustar ou escrever a explicação do zero
3. **Salvar**: Clica em "Salvar e Próxima" para salvar e avançar automaticamente

### 3. Modelo de Justificativa (Usado pela IA)

A IA segue este modelo obrigatório:

#### Estrutura:
1. **Abertura**: "A alternativa X é a correta porque..."
2. **Raciocínio Clínico**: 
   - Destacar achados-chave do enunciado
   - Conectar com condutas aceitas/diretrizes
   - Explicar objetivo do diagnóstico/tratamento
3. **Alternativas Incorretas**: "As demais alternativas estão incorretas porque..."
   - Comentar brevemente o erro de cada (A, B, C, D)
4. **Finalização**: "Portanto, a conduta correta é a alternativa X..."

#### Estilo:
- Claro, objetivo e didático
- Formato "mini-aula"
- Sem parágrafos enormes
- Focado em raciocínio clínico padrão Revalida
- Sem jargões desnecessários
- Sem inventar dados que não estão no enunciado

### 4. Verificar Progresso

Execute o script SQL `scripts/verificar-questoes-sem-explicacao.sql` no Supabase para:
- Ver quantas questões ainda faltam
- Ver distribuição por tema
- Verificar qualidade das explicações existentes

## Scripts SQL Úteis

### Contar questões sem explicação:
\`\`\`sql
SELECT COUNT(*) FROM questoes WHERE explicacao IS NULL;
\`\`\`

### Ver questões de um tema específico sem explicação:
\`\`\`sql
SELECT id, LEFT(questao, 100) as preview
FROM questoes 
WHERE explicacao IS NULL AND tema = 'cardiologia'
LIMIT 10;
\`\`\`

### Atualizar explicação manualmente:
\`\`\`sql
UPDATE questoes 
SET explicacao = 'Sua justificativa aqui...'
WHERE id = 'id-da-questao';
\`\`\`

## Dicas

1. **Use a IA como ponto de partida**: A IA gera boas explicações, mas sempre revise antes de salvar
2. **Mantenha consistência**: Siga sempre o mesmo modelo de justificativa
3. **Seja objetivo**: Explicações entre 300-600 palavras são ideais
4. **Foco no raciocínio**: Explique o "porquê" mais do que o "o quê"
5. **Trabalhe por tema**: Organizar por tema ajuda a manter consistência clínica

## Monitoramento

O dashboard principal já mostra quantas questões foram completadas. Com explicações em todas as questões, a experiência de estudo dos usuários será muito melhor!
