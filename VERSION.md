# Bora Revalidar - Changelog

## Versão 2.0.0 - Janeiro 2025

### Novas Funcionalidades

#### Sistema de Seleção por Grande Área e Subtemas
- Adicionado novo modo de seleção de questões por grande área
- Interface com checkboxes para seleção múltipla de subtemas
- Carregamento dinâmico de subtemas baseado na área selecionada
- Funções `getSubtemasByTema()` e `getQuestionsByTemaAndSubtemas()` no storage-supabase

#### Sistema de Tema Claro/Escuro
- Botão de alternância de tema na navbar (desktop e mobile)
- Botão de alternância na página de login
- Paleta de cores otimizada para modo claro (tons claros e brancos)
- Modo escuro mantém o design original do app
- Transições suaves entre temas

### Arquivos Modificados
- `/lib/storage-supabase.ts` - Novas funções de busca por subtemas
- `/app/study/page.tsx` - Interface de seleção por subtemas
- `/app/globals.css` - Tokens de cor para modo claro
- `/components/theme-toggle-button.tsx` - Novo componente de toggle
- `/components/navbar.tsx` - Integração do botão de tema
- `/app/login/page.tsx` - Botão de tema na tela de login
- `/app/page.tsx` - Botão de tema na página inicial
- `/app/settings/page.tsx` - Card de aparência

### Compatibilidade
- Mantém 100% de compatibilidade com sistema anterior
- Modo de seleção tradicional por matéria continua disponível
- Sem breaking changes

---
Atualizado em: Janeiro 2025
