import { createClient } from "@supabase/supabase-js"
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Consolidar subtemas fragmentados para o nome canônico usado no app
const consolidacoes = [
  // Medicina Preventiva
  { de_subtema: "APS / Medicina de Família",        para_subtema: "APS / Saúde da Família", tema: "Medicina Preventiva" },
  { de_subtema: "Atenção Primária à Saúde (APS)",   para_subtema: "APS / Saúde da Família", tema: "Medicina Preventiva" },
  { de_subtema: "Imunizações e Calendário Vacinal",  para_subtema: "Imunizações e Vigilância Epidemiológica", tema: "Medicina Preventiva" },
  { de_subtema: "Ética Médica",                      para_subtema: "Ética Médica e Bioética", tema: "Medicina Preventiva" },
  { de_subtema: "Ética Médica / Bioética",           para_subtema: "Ética Médica e Bioética", tema: "Medicina Preventiva" },
  { de_subtema: "Segurança do Paciente",             para_subtema: "Políticas Públicas de Saúde", tema: "Medicina Preventiva" },
  // Clínica Médica
  { de_subtema: "Nefrologia",                        para_subtema: "Nefrologia / Urologia", tema: "Clínica Médica" },
  { de_subtema: "Ortopedia / Reumatologia",          para_subtema: "Reumatologia / Ortopedia", tema: "Clínica Médica" },
  { de_subtema: "Oncologia / Cuidados Paliativos",   para_subtema: "Oncologia / Hematologia", tema: "Clínica Médica" },
  { de_subtema: "Urgências Clínicas",                para_subtema: "Urgências Clínicas / Outros", tema: "Clínica Médica" },
  // Pediatria
  { de_subtema: "Hematologia Pediátrica",            para_subtema: "Hematologia / Oncologia Pediátrica", tema: "Pediatria" },
  { de_subtema: "Saúde da Criança",                  para_subtema: "Saúde da Criança e Adolescente", tema: "Pediatria" },
  { de_subtema: "Imunizações",                       para_subtema: "Imunizações e Vigilância Epidemiológica", tema: "Pediatria" },
  { de_subtema: "Parasitoses Pediátricas",           para_subtema: "Infectologia Pediátrica", tema: "Pediatria" },
  // Ginecologia
  { de_subtema: "Ginecologia Geral / Prevenção",     para_subtema: "Oncologia Ginecológica", tema: "Ginecologia e Obstetrícia" },
]

let totalOk = 0, totalErr = 0
for (const c of consolidacoes) {
  const { data, error } = await supabase
    .from("questoes")
    .update({ subtema: c.para_subtema })
    .eq("tema", c.tema)
    .eq("subtema", c.de_subtema)
    .select("pk")
  if (error) { console.error(`ERRO: ${c.de_subtema} → ${c.para_subtema}:`, error.message); totalErr++ }
  else { console.log(`OK [${c.tema}] "${c.de_subtema}" → "${c.para_subtema}": ${data.length} questões`); totalOk += data.length }
}
console.log(`\nConsolidação: ${totalOk} questões atualizadas, ${totalErr} erros`)
