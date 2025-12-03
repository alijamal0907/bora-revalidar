# Manual de Uso dos Flashcards - Bora Revalidar

## Índice
1. [Visão Geral](#visão-geral)
2. [Estrutura da Tabela](#estrutura-da-tabela)
3. [Como Adicionar Flashcards Manualmente](#como-adicionar-flashcards-manualmente)
4. [Como Importar Flashcards em Massa (CSV)](#como-importar-flashcards-em-massa-csv)
5. [Arquivos Criados](#arquivos-criados)
6. [Fluxo de Navegação](#fluxo-de-navegação)

---

## Visão Geral

O sistema de Flashcards foi implementado para permitir que os usuários do Bora Revalidar revisem os principais temas do Revalida de forma ativa e eficiente através de flashcards.

### Funcionalidades:
- ✅ Estudo por matéria específica ou todas as matérias
- ✅ Organização por temas dentro de cada matéria
- ✅ Modo de estudo interativo com frente/verso
- ✅ Tracking de acertos e erros
- ✅ Opção de revisar apenas os cards errados
- ✅ Acessível para usuários FREE e PREMIUM
- ✅ Totalmente responsivo (mobile e desktop)

---

## Estrutura da Tabela

### Tabela: `flashcards`

A tabela foi criada no schema `public` do Supabase com a seguinte estrutura:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid (PK) | Identificador único do flashcard |
| `materia` | text (NOT NULL) | Matéria do Revalida (ex: "Clínica Médica") |
| `tema` | text (NOT NULL) | Tema específico dentro da matéria |
| `frente` | text (NOT NULL) | Pergunta/gatilho do flashcard |
| `verso` | text (NOT NULL) | Resposta/explicação do flashcard |
| `created_at` | timestamptz | Data de criação (auto) |
| `updated_at` | timestamptz | Data de última atualização (auto) |
| `is_global` | boolean | Se `true`, é flashcard global do app |
| `user_id` | uuid (NULL) | ID do usuário (para flashcards personalizados no futuro) |

### Matérias Válidas:
- Clínica Médica
- Cirurgia
- Ginecologia e Obstetrícia
- Pediatria
- Medicina Preventiva e Social

### Políticas RLS (Row Level Security):
- ✅ Usuários autenticados podem ler flashcards globais (`is_global = true`)
- ✅ Usuários podem criar, atualizar e deletar apenas seus próprios flashcards personalizados

---

## Como Adicionar Flashcards Manualmente

### Passo 1: Acessar o Supabase
1. Entre em [https://supabase.com](https://supabase.com)
2. Faça login e selecione seu projeto
3. No menu lateral, clique em **"Table Editor"**

### Passo 2: Selecionar a Tabela
1. Localize e clique na tabela **`flashcards`**
2. Clique no botão **"Insert"** → **"Insert row"**

### Passo 3: Preencher os Dados
Preencha os seguintes campos:

- **materia**: Escolha uma das 5 matérias válidas (use EXATAMENTE como listado acima)
- **tema**: Digite o tema específico (ex: "Doenças cardiovasculares (IAM, ICC, Arritmias, HAS)")
- **frente**: Digite a pergunta/gatilho (ex: "Quais são os sinais de IAM no ECG?")
- **verso**: Digite a resposta/explicação completa
- **is_global**: Marque como `true` (ou deixe o padrão)
- **user_id**: Deixe como `NULL` (para flashcards globais)

### Passo 4: Salvar
1. Clique em **"Save"**
2. O flashcard será adicionado imediatamente ao app

---

## Como Importar Flashcards em Massa (CSV)

### Passo 1: Preparar o Arquivo CSV

Crie um arquivo CSV com as seguintes colunas (nesta ordem):

\`\`\`
materia,tema,frente,verso,is_global
\`\`\`

**Exemplo de conteúdo:**

\`\`\`csv
materia,tema,frente,verso,is_global
Clínica Médica,Doenças cardiovasculares (IAM, ICC, Arritmias, HAS),Quais são os sinais de IAM no ECG?,Supradesnivelamento do segmento ST em derivações contíguas,true
Clínica Médica,Doenças cardiovasculares (IAM, ICC, Arritmias, HAS),Qual a primeira conduta no IAM com supra de ST?,Reperfusão imediata (angioplastia primária ou fibrinólise),true
Cirurgia,Abdômen agudo (apendicite, colecistite, obstrução, pancreatite),Qual é o sinal de Blumberg?,Dor à descompressão brusca na FID (sinal de irritação peritoneal),true
\`\`\`

### Passo 2: Importar no Supabase

1. Acesse **Table Editor** → **flashcards**
2. Clique no botão de menu (três pontos) no canto superior direito
3. Selecione **"Import data"** → **"CSV"**
4. Faça upload do arquivo CSV
5. Confirme que as colunas estão mapeadas corretamente
6. Clique em **"Import"**

### Passo 3: Verificar
- Após a importação, recarregue a página
- Verifique se os flashcards aparecem na tabela
- Teste no app entrando em `/flashcards`

---

## Arquivos Criados

### 1. **Scripts SQL**
- `scripts/create-flashcards-table.sql` - Criação da tabela e políticas RLS

### 2. **Configuração**
- `lib/flashcards-config.ts` - Definição de matérias, temas, ícones e descrições

### 3. **Storage/API**
- `lib/flashcards-storage.ts` - Funções para buscar flashcards do Supabase

### 4. **Páginas**
- `app/flashcards/page.tsx` - Página principal com seleção de matéria e tema

### 5. **Componentes**
- `components/flashcard-study-mode.tsx` - Modo de estudo interativo dos flashcards

### 6. **Documentação**
- `docs/FLASHCARDS_MANUAL.md` - Este manual

---

## Fluxo de Navegação

### ETAPA 1: Dashboard
- Usuário acessa `/dashboard`
- Vê o novo card **"Flashcards"** com ícone de cérebro roxo
- Clica para ir para `/flashcards`

### ETAPA 2: Escolha da Matéria
- Usuário vê 6 cards:
  - **"Todas as matérias"** (destaque em verde/laranja)
  - **Clínica Médica** ❤️
  - **Cirurgia** 🔪
  - **Ginecologia e Obstetrícia** 👶
  - **Pediatria** 🧒
  - **Medicina Preventiva e Social** 🏥
- Clica em uma matéria (ou "Todas")

### ETAPA 3: Escolha do Tema
- Se escolheu matéria específica:
  - Vê lista numerada dos temas daquela matéria
  - Cada tema é um botão clicável
- Se escolheu "Todas as matérias":
  - Vê botão único "Revisar todos os temas"
- Clica em um tema

### ETAPA 4: Modo de Estudo
- **Se não houver flashcards cadastrados:**
  - Mostra mensagem: "Ainda não há flashcards cadastrados para este tema"
  - Botão para voltar

- **Se houver flashcards:**
  - Mostra um card por vez com a **frente** (pergunta)
  - Barra de progresso no topo
  - Contador de acertos/erros
  - Botão **"Mostrar resposta"**
  
  - Ao mostrar resposta:
    - Revela o **verso** (resposta)
    - Mostra 2 botões:
      - ❌ **"Errei"** (vermelho)
      - ✅ **"Acertei"** (verde)
  
  - Ao finalizar todos os cards:
    - Tela de resumo com:
      - Total de cards estudados
      - Número de acertos
      - Número de erros
      - Taxa de acerto (%)
    - Opções:
      - **"Rever apenas os que errei"** (se houver erros)
      - **"Recomeçar"** (reinicia a sessão)
      - **"Escolher outro tema"** (volta para seleção de tema)

### Botão Voltar
- Em qualquer momento (menos no modo estudo ativo), há um botão ← para voltar:
  - Da escolha de tema → volta para escolha de matéria
  - Do modo estudo → volta para escolha de tema

---

## Comportamento por Plano

- **FREE e PREMIUM**: Ambos têm acesso total aos flashcards
- Sem limite diário de flashcards
- Todos os temas disponíveis para ambos os planos

---

## Próximos Passos (Futuro)

- [ ] Permitir usuários criarem flashcards personalizados
- [ ] Implementar algoritmo de repetição espaçada (SRS)
- [ ] Adicionar estatísticas de desempenho por tema
- [ ] Modo de estudo com timer
- [ ] Gamificação (badges, streak)

---

## Suporte

Se tiver dúvidas ou problemas:
1. Verifique se a tabela `flashcards` foi criada corretamente no Supabase
2. Confira se há flashcards cadastrados para o tema selecionado
3. Verifique os logs do console do navegador para erros
4. Teste primeiro com um tema que você sabe que tem flashcards cadastrados

---

**Desenvolvido para Bora Revalidar** 🎯📚
