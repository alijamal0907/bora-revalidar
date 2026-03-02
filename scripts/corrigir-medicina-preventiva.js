import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Correções identificadas por análise clínica dos enunciados
const correcoes = [
  // APS → Pediatria: enunciados sobre crianças, não sobre organização de serviço
  { pk: '88dcdc73-8afe-43d4-89b9-645b2cbdcca1', tema: 'Pediatria', subtema: 'Parasitoses Pediátricas', motivo: 'Criança 5 anos com prurido periungueal (oxiurose) — Pediatria' },
  { pk: '03e57953-58be-4974-93ce-4e9d9dcbbdc4', tema: 'Pediatria', subtema: 'Saúde da Criança', motivo: 'Criança 4 anos com taquicardia em área indígena — Pediatria' },

  // Políticas Públicas → outros temas: enunciados clínicos sem relação com política de saúde
  { pk: 'c400ec76-9272-4e13-be56-4c2b230775b1', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva', motivo: 'Mulher 22 anos dor periumbilical em cólica — Cirurgia' },
  { pk: '3e6ceb3b-9170-4c21-b239-26de3f89c96f', tema: 'Clínica Médica', subtema: 'Hematologia', motivo: 'Avaliação laboratorial de anemia / reticulócitos — Hematologia' },
  { pk: 'f51d9ee2-764d-4fc2-be89-bd772a5a5886', tema: 'Cirurgia', subtema: 'Trauma / ATLS', motivo: 'Trauma por queda de andaime 4m — Cirurgia Trauma' },
  { pk: 'aecf1697-9cc3-4b64-8777-2241481fc460', tema: 'Cirurgia', subtema: 'Trauma / ATLS', motivo: 'Dor lombar irradiada após queda, SAMU — Cirurgia Trauma' },
  { pk: 'e11ef4b1-9fbd-4a4f-92ae-ca84d1b5c99d', tema: 'Clínica Médica', subtema: 'Psiquiatria', motivo: 'Alteração no padrão do sono — Psiquiatria' },
  { pk: '16d40bfb-31cc-4356-a663-d75e5b1fbb43', tema: 'Clínica Médica', subtema: 'Cardiologia', motivo: 'Crise hipertensiva PA 230x150, confusa, sudoreica — Cardiologia' },
  { pk: '729c2aa6-e78f-4bc3-9a65-48fbe5e948bd', tema: 'Pediatria', subtema: 'Saúde da Criança', motivo: 'Menino 6 anos com fimose — Pediatria' },
  { pk: '7ab5d33f-217e-4641-82ff-629bb3b148f0', tema: 'Medicina Preventiva', subtema: 'Atenção Primária à Saúde (APS)', motivo: 'ESF reunião com moradores — pertence a APS, não a Políticas Públicas' },

  // Segurança do Paciente → Pediatria / Políticas Públicas
  { pk: '68eff53c-8042-46c7-916f-6c2824237dac', tema: 'Pediatria', subtema: 'Neurologia Pediátrica', motivo: 'Lactente 3 meses mover os olhos (nistagmo/estrabismo) — Pediatria' },
  { pk: 'd9714f75-f0de-486c-8b78-c7e5b42fcadd', tema: 'Medicina Preventiva', subtema: 'Políticas Públicas de Saúde', motivo: 'Redução mortalidade infantil é tema de Políticas Públicas' },

  // Epidemiologia → APS: rastreamento clínico individual não é epidemiologia
  { pk: '4804b480-117c-4629-9140-22bce57c0909', tema: 'Medicina Preventiva', subtema: 'Atenção Primária à Saúde (APS)', motivo: 'Homem 51 anos assintomático, abordagem médico de família — APS/rastreamento' },
]

console.log(`Aplicando ${correcoes.length} correções em Medicina Preventiva...\n`)

let acertos = 0
let erros = 0

for (const c of correcoes) {
  const { error } = await supabase
    .from('questoes')
    .update({ tema: c.tema, subtema: c.subtema })
    .eq('pk', c.pk)

  if (error) {
    console.log(`ERRO [pk=${c.pk}]: ${error.message}`)
    erros++
  } else {
    console.log(`OK → ${c.tema} > ${c.subtema} | ${c.motivo}`)
    acertos++
  }
}

console.log(`\n=== RESULTADO ===`)
console.log(`Corrigidas: ${acertos}`)
console.log(`Erros:      ${erros}`)
