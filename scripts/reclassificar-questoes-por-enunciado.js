import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function toSlug(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-")
}

function reclassificar(enunciado, temaAtual) {
  const e = (enunciado || "").toLowerCase()
  const isPed = /recém-nascido|neonato|lactente|puericultura|alojamento conjunto|apgar|bebê com \d|criança de \d+ mes|menino de \d+ mes|menina de \d+ mes/.test(e)
  const isObs = /gestante|gestação|pré-natal|grávida|primigesta|semana de gestação|beta-hcg|eclâmpsia|pré-eclâmpsia|puerpério/.test(e)
  const isGin = /menstrua|ciclo menstrual|contraceptiv|anticoncep|endometri|mioma|colo do útero|citopat|menopausa|dispareunia/.test(e)

  if (isPed && !isObs && temaAtual !== "Pediatria") {
    if (/vacin|imunizaç/.test(e)) return { tema: "Pediatria", subtema: "Imunizações" }
    if (/infecç|bactéri|viral|meningit|pneumoni|bronquiol/.test(e)) return { tema: "Pediatria", subtema: "Infectologia Pediátrica" }
    if (/leucemia|linfoma|plaqueta|oncolog/.test(e)) return { tema: "Pediatria", subtema: "Hematologia / Oncologia Pediátrica" }
    if (/convulsão|paralisia|down/.test(e)) return { tema: "Pediatria", subtema: "Neurologia Pediátrica" }
    if (/icterícia|prematur|neonat/.test(e)) return { tema: "Pediatria", subtema: "Neonatologia" }
    if (/diarreia|desidrat|nutrição|aleitamento/.test(e)) return { tema: "Pediatria", subtema: "Crescimento e Desenvolvimento" }
    return { tema: "Pediatria", subtema: "Crescimento e Desenvolvimento" }
  }
  if (isObs && !isPed && temaAtual !== "Ginecologia e Obstetrícia")
    return { tema: "Ginecologia e Obstetrícia", subtema: "Pré-natal e Obstetrícia" }
  if (isGin && !isPed && !isObs && temaAtual !== "Ginecologia e Obstetrícia") {
    if (/ist|sífilis|gonorreia|clamídia|corrimento/.test(e)) return { tema: "Ginecologia e Obstetrícia", subtema: "IST / Infecções Ginecológicas" }
    if (/câncer|neoplasia|carcinoma|citopat/.test(e)) return { tema: "Ginecologia e Obstetrícia", subtema: "Oncologia Ginecológica" }
    return { tema: "Ginecologia e Obstetrícia", subtema: "Ginecologia Geral" }
  }
  return null
}

async function main() {
  const { data: all, error } = await supabase
    .from("questoes").select("pk, enunciado, tema, subtema").limit(2000)
  if (error) { console.error(error.message); return }
  console.log("Carregadas:", all.length)

  const correcoes = []
  for (const q of all) {
    if (!q.pk || !q.enunciado) continue
    const novo = reclassificar(q.enunciado, q.tema)
    if (novo && (novo.tema !== q.tema || novo.subtema !== q.subtema))
      correcoes.push({ pk: q.pk, ...novo, de: `${q.tema} > ${q.subtema}`, texto: q.enunciado.substring(0, 80) })
  }

  console.log("A reclassificar:", correcoes.length)
  for (const c of correcoes)
    console.log(`  ${c.de} → ${c.tema} > ${c.subtema} | "${c.texto}"`)

  let ok = 0
  for (const c of correcoes) {
    const { error } = await supabase.from("questoes")
      .update({ tema: c.tema, subtema: c.subtema, subtema_slug: toSlug(c.subtema) })
      .eq("pk", c.pk)
    if (error) console.error("ERRO:", error.message)
    else ok++
  }
  console.log("Atualizadas:", ok)
}

main().catch(console.error)
