# Instruções para Fazer Deploy das Alterações

## Arquivos Modificados

As seguintes alterações foram feitas e estão funcionando no preview do v0:

### 1. `/lib/storage-supabase.ts`
- Adicionadas 3 novas funções:
  - `getSubtemasByTema()` - Busca subtemas de uma grande área
  - `getQuestionsByTemaAndSubtemas()` - Busca questões por tema e subtemas
  
### 2. `/app/study/page.tsx`
- Novo modo de seleção: "Por Grande Área e Subtemas"
- Interface com checkboxes para seleção de múltiplos subtemas
- Sistema de carregamento dinâmico de subtemas

### 3. `/components/theme-toggle-button.tsx` (NOVO ARQUIVO)
- Botão compacto para alternar entre tema claro/escuro

### 4. `/app/login/page.tsx`
- Adicionado botão de tema no canto superior direito

### 5. `/app/page.tsx`
- Adicionado botão de tema

### 6. `/components/navbar.tsx`
- Botão de tema adicionado no menu desktop e mobile

### 7. `/app/globals.css`
- Cores do modo claro ajustadas para tons claros e brancos

### 8. `/app/settings/page.tsx`
- Card de aparência com seletor de tema

## Como Fazer o Deploy Manual

### Opção 1: Editar Diretamente no GitHub (MAIS FÁCIL)

1. Acesse: https://github.com/alijamal0907/bora-revalidar
2. Para cada arquivo acima:
   - Clique no arquivo
   - Clique no ícone de lápis (Edit this file)
   - Cole o conteúdo atualizado
   - Clique em "Commit changes"

### Opção 2: Usar Git Desktop/CLI

1. Clone o repositório
2. Crie um novo branch: `git checkout -b feature/subtemas-theme`
3. Aplique todas as mudanças listadas acima
4. Faça commit: `git commit -am "Adicionar seleção por subtemas e sistema de temas"`
5. Faça push: `git push origin feature/subtemas-theme`
6. Crie Pull Request e faça merge para main

### Opção 3: Download e Upload

1. Clique nos 3 pontinhos no v0 e faça "Download ZIP"
2. Extraia os arquivos
3. No GitHub, faça upload dos arquivos modificados

## Depois do Merge no GitHub

A Vercel fará deploy automaticamente. Se houver erro de integração do Supabase:

1. Vá para: https://vercel.com/dashboard
2. Selecione o projeto `bora-revalidar`
3. Vá em Settings → Integrations
4. Reconecte o Supabase se necessário
5. Clique em "Redeploy"

## Resumo das Funcionalidades Adicionadas

✅ **Sistema de Tema Claro/Escuro**
- Botão de alternância em todas as páginas
- Modo escuro: design atual
- Modo claro: tons claros e brancos

✅ **Seleção por Grande Área e Subtemas**
- Escolher grande área (ex: Clínica Médica)
- Selecionar múltiplos subtemas via checkbox
- Se nenhum subtema selecionado = todos os subtemas da área

---

**Status**: ✅ Testado e funcionando no preview do v0
**Pronto para**: Deploy em produção
