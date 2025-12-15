import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface Questao {
  id: string
  questao: string
  alternativaa: string
  alternativab: string
  alternativac: string
  alternativad: string
  alternativae?: string
  correta: string
  tema: string
  explicacao?: string | null
}

// Função para gerar explicação seguindo o modelo obrigatório
function gerarExplicacao(q: Questao): string {
  const alternativaCorreta = q.correta.toUpperCase()
  const textoCorreta = q[`alternativa${alternativaCorreta.toLowerCase()}` as keyof Questao] as string

  // Estrutura obrigatória do modelo
  let explicacao = `A alternativa ${alternativaCorreta} é a correta porque `

  // Aqui você deve adicionar o raciocínio clínico específico
  // Este é um template que precisa ser preenchido com análise médica real
  explicacao += `[ANÁLISE CLÍNICA NECESSÁRIA: Explicar por que ${textoCorreta} está correto, destacando achados-chave do enunciado e conectando com diretrizes/condutas aceitas].\n\n`

  explicacao += `As demais alternativas estão incorretas porque:\n`

  // Analisar cada alternativa incorreta
  const alternativas = ["A", "B", "C", "D", "E"]
  for (const alt of alternativas) {
    if (alt !== alternativaCorreta) {
      const textoAlt = q[`alternativa${alt.toLowerCase()}` as keyof Questao]
      if (textoAlt) {
        explicacao += `- ${alt}: [ANÁLISE NECESSÁRIA: Explicar por que ${textoAlt} está incorreta]\n`
      }
    }
  }

  explicacao += `\nPortanto, a conduta correta é a alternativa ${alternativaCorreta}.`

  return explicacao
}

async function analisarEGerarExplicacoes() {
  console.log("🔍 Analisando questões no banco de dados...\n")

  // Buscar estatísticas
  const { count: totalQuestoes } = await supabase.from("questoes").select("*", { count: "exact", head: true })

  const { count: comExplicacao } = await supabase
    .from("questoes")
    .select("*", { count: "exact", head: true })
    .not("explicacao", "is", null)

  const semExplicacao = (totalQuestoes || 0) - (comExplicacao || 0)

  console.log(`📊 ESTATÍSTICAS:`)
  console.log(`   Total de questões: ${totalQuestoes}`)
  console.log(`   Com explicação: ${comExplicacao}`)
  console.log(`   Sem explicação: ${semExplicacao}\n`)

  if (semExplicacao === 0) {
    console.log("✅ Todas as questões já têm explicação!")
    return
  }

  // Buscar exemplo de explicação existente
  const { data: exemploComExplicacao } = await supabase
    .from("questoes")
    .select("*")
    .not("explicacao", "is", null)
    .limit(1)
    .single()

  if (exemploComExplicacao) {
    console.log(`📝 EXEMPLO DE EXPLICAÇÃO EXISTENTE (ID: ${exemploComExplicacao.id}):`)
    console.log(`   Questão: ${exemploComExplicacao.questao.substring(0, 100)}...`)
    console.log(`   Explicação: ${exemploComExplicacao.explicacao?.substring(0, 200)}...\n`)
  }

  // Buscar questões sem explicação (em lotes pequenos)
  console.log("🔎 Buscando questões sem explicação...\n")

  let offset = 0
  const batchSize = 10
  let totalProcessadas = 0

  while (true) {
    const { data: questoesSemExplicacao, error } = await supabase
      .from("questoes")
      .select("*")
      .is("explicacao", null)
      .range(offset, offset + batchSize - 1)

    if (error) {
      console.error("❌ Erro ao buscar questões:", error)
      break
    }

    if (!questoesSemExplicacao || questoesSemExplicacao.length === 0) {
      break
    }

    console.log(
      `📦 Processando lote ${Math.floor(offset / batchSize) + 1} (${questoesSemExplicacao.length} questões)...\n`,
    )

    for (const questao of questoesSemExplicacao) {
      console.log(`\n${"=".repeat(80)}`)
      console.log(`📄 QUESTÃO ID: ${questao.id}`)
      console.log(`📚 Tema: ${questao.tema}`)
      console.log(`❓ Enunciado: ${questao.questao.substring(0, 150)}...`)
      console.log(`\n🔤 ALTERNATIVAS:`)
      console.log(`   A) ${questao.alternativaa}`)
      console.log(`   B) ${questao.alternativab}`)
      console.log(`   C) ${questao.alternativac}`)
      console.log(`   D) ${questao.alternativad}`)
      if (questao.alternativae) console.log(`   E) ${questao.alternativae}`)
      console.log(`\n✅ RESPOSTA CORRETA: ${questao.correta}`)

      // Gerar explicação template
      const explicacaoGerada = gerarExplicacao(questao)

      console.log(`\n💡 EXPLICAÇÃO GERADA (TEMPLATE):`)
      console.log(explicacaoGerada)
      console.log(
        `\n⚠️  ATENÇÃO: Esta é uma explicação TEMPLATE que precisa ser revisada e preenchida com análise clínica real.`,
      )
      console.log(`${"=".repeat(80)}\n`)

      totalProcessadas++

      // Para evitar sobrecarga, vamos apenas mostrar as primeiras 5 questões
      if (totalProcessadas >= 5) {
        console.log(`\n⏸️  Mostrando apenas as primeiras 5 questões para análise.`)
        console.log(`   Execute o script completo para processar todas as ${semExplicacao} questões.\n`)
        return
      }
    }

    offset += batchSize
  }

  console.log(`\n✅ Análise concluída! Total de questões processadas: ${totalProcessadas}`)
  console.log(`\n📋 PRÓXIMOS PASSOS:`)
  console.log(`   1. Revise as explicações geradas acima`)
  console.log(`   2. Para cada questão, substitua os [ANÁLISE NECESSÁRIA] com conteúdo médico real`)
  console.log(`   3. Use a página /admin/explicacoes do app para editar e salvar as explicações`)
  console.log(`   4. Ou execute updates SQL manuais no Supabase com as explicações completas\n`)
}

// Executar
analisarEGerarExplicacoes().catch(console.error)
