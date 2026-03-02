import { createClient } from "@supabase/supabase-js"
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const correcoes = [
  // Endocrinologia Reprodutiva → outros temas
  { pk: "d3f55ac9-0912-4871-a060-486385430390", tema: "Clínica Médica", subtema: "Reumatologia" },
  { pk: "8be06ada-564b-4efb-bfbd-8809a19f43a3", tema: "Clínica Médica", subtema: "Cardiologia" },

  // Ginecologia / Obstetrícia (intercorrências clínicas) → subtemas corretos
  { pk: "8090163e-b801-4d55-903c-d293a3cad53c", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  { pk: "24157e9a-66b5-44fe-8056-adc1e1bba1e9", tema: "Ginecologia e Obstetrícia", subtema: "Ginecologia Geral" },
  { pk: "c357231e-2290-4a98-b8b8-c656c3909120", tema: "Ginecologia e Obstetrícia", subtema: "Pré-natal e Obstetrícia" },
  { pk: "5b5c294e-f7cf-4dee-be76-9a3f3b4f9cad", tema: "Ginecologia e Obstetrícia", subtema: "Pré-natal e Obstetrícia" },
  { pk: "8fe75018-30b1-4759-8853-3e9465224bc3", tema: "Ginecologia e Obstetrícia", subtema: "Pré-natal e Obstetrícia" },

  // Ginecologia Geral → outros temas
  { pk: "8f1cbdc0-95ee-4f75-b2c4-4a9ba371679d", tema: "Clínica Médica", subtema: "Oftalmologia" },
  { pk: "2e95ee3c-fa62-45ba-a16d-5c30fcb692f8", tema: "Clínica Médica", subtema: "Infectologia" },
  { pk: "5fe7665e-608f-4663-9746-aa97de9cfea7", tema: "Clínica Médica", subtema: "Pneumologia" },
  { pk: "36e9c2cf-9adf-495f-b028-46b2a573c56b", tema: "Clínica Médica", subtema: "Cardiologia" },
  { pk: "e0efb9c5-abdb-4bbf-ad2f-876ec8a6e7f4", tema: "Pediatria", subtema: "Infectologia Pediátrica" },
  { pk: "66698b50-2437-4177-8873-12ce70d17acb", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  { pk: "c7473db1-51f6-40bd-bc12-9a60d4c54dee", tema: "Clínica Médica", subtema: "Endocrinologia" },
  { pk: "ca24457f-852c-4a55-b6e1-8b1512a5cc57", tema: "Clínica Médica", subtema: "Gastroenterologia" },
  { pk: "e3ca1731-8644-4430-ba04-9d565f1b7045", tema: "Clínica Médica", subtema: "Urgências Clínicas" },
  { pk: "9da6123f-a76d-4b39-9806-922bec9cfd05", tema: "Clínica Médica", subtema: "Infectologia" },
  { pk: "b9022b1d-9b9b-46e0-b4eb-8c0c2a220fb0", tema: "Pediatria", subtema: "Hematologia / Oncologia Pediátrica" },
  { pk: "6a2a69c5-3f41-4891-a3ba-cf263a6a7010", tema: "Clínica Médica", subtema: "Cardiologia" },
  { pk: "e7759fe8-9c5e-439f-953c-e342d655c277", tema: "Clínica Médica", subtema: "Reumatologia" },
  { pk: "e956b9f3-6c07-4ced-ae90-97bd0f7ef395", tema: "Ginecologia e Obstetrícia", subtema: "Pré-natal e Obstetrícia" },
  { pk: "8c99f3a8-701f-4c98-ac1a-db4091bcd625", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "c08c3918-d95f-45c6-b7f8-2186889292b1", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  { pk: "6ca6a9c2-d8c7-4959-8fec-007a659f22c5", tema: "Clínica Médica", subtema: "Oncologia / Hematologia" },
  { pk: "2d3255ce-bca5-4fc6-a038-74a79d9e1a4d", tema: "Ginecologia e Obstetrícia", subtema: "Ginecologia Geral" },
  { pk: "f56c7920-6e6a-4386-9388-3ac868e8fa83", tema: "Pediatria", subtema: "Urgências Pediátricas" },
  { pk: "c4a3b7be-7daa-43b1-90eb-8c3934b92038", tema: "Pediatria", subtema: "Urgências Pediátricas" },
  { pk: "9677d516-ec2b-418a-83a6-f0d8de58df78", tema: "Pediatria", subtema: "Neonatologia" },
  { pk: "7680a41d-d90a-42e9-b0f5-d3c89261d9f1", tema: "Pediatria", subtema: "Neurologia Pediátrica" },
  { pk: "59419a6d-067f-4d02-ae5c-49eb000fa623", tema: "Pediatria", subtema: "Neurologia Pediátrica" },
]

let ok = 0, err = 0
for (const c of correcoes) {
  const { error } = await supabase.from("questoes").update({ tema: c.tema, subtema: c.subtema }).eq("pk", c.pk)
  if (error) { console.error(`ERRO pk=${c.pk}:`, error.message); err++ }
  else { console.log(`OK pk=${c.pk} → ${c.tema} > ${c.subtema}`); ok++ }
}
console.log(`\nParte 1: ${ok} corrigidas, ${err} erros`)
