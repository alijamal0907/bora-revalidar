import { createClient } from "@supabase/supabase-js"
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const correcoes = [
  // IST / Infecções Ginecológicas → outros temas (parte 2)
  { pk: "d24230ff-c03d-45d4-a0d2-ba06c95514a1", tema: "Clínica Médica", subtema: "Neurologia" },
  { pk: "724f79ea-afa6-40cf-81c5-28937fd7bd24", tema: "Clínica Médica", subtema: "Neurologia" },
  { pk: "f9c142b1-fd07-470b-a628-866940170811", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  { pk: "994288ef-4326-476d-8d10-3e91f10493a1", tema: "Clínica Médica", subtema: "Hematologia" },
  { pk: "2a86d964-bf07-499b-82c7-06deba512d75", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "cca262ff-9656-44c8-ade5-1d504e4a4a5f", tema: "Clínica Médica", subtema: "Cardiologia" },
  { pk: "c895b926-a868-4fab-951b-4a8235e5535a", tema: "Clínica Médica", subtema: "Urgências Clínicas" },
  { pk: "de8bb628-6e2b-4dfb-85d4-c584a7af00bb", tema: "Clínica Médica", subtema: "Reumatologia" },
  { pk: "1c1acf02-87da-4155-8b66-bcc04231baaf", tema: "Clínica Médica", subtema: "Cardiologia" },
  { pk: "e77a3605-e401-4e49-a08c-7f586de4af84", tema: "Medicina Preventiva", subtema: "Políticas Públicas de Saúde" },
  { pk: "45b1eca4-e948-42b9-b679-ad814cdac835", tema: "Clínica Médica", subtema: "Cardiologia" },
  { pk: "94840ca1-b39f-45d4-8fd3-d1f74484c3ec", tema: "Clínica Médica", subtema: "Nefrologia / Urologia" },
  { pk: "f5ea2c01-e857-4d95-be33-5bae1cc3c084", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "e72641ae-dddd-4fc7-bcf6-3d6b4ab98523", tema: "Clínica Médica", subtema: "Ortopedia / Reumatologia" },
  { pk: "1cdc82bf-cb1f-4777-9914-add31febde20", tema: "Clínica Médica", subtema: "Nefrologia / Urologia" },
  { pk: "3be5aea0-8811-4f3b-a960-87d0ec244277", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  { pk: "25677d9d-e088-4ffe-a88a-4b767cc323d6", tema: "Cirurgia", subtema: "Feridas / Técnica Cirúrgica" },
  { pk: "1217c694-196a-46a0-a929-595c25f0ffd5", tema: "Clínica Médica", subtema: "Gastroenterologia" },
  { pk: "183808c2-2672-491b-adb7-cda70d4ce3af", tema: "Clínica Médica", subtema: "Oftalmologia" },
  { pk: "0a11f1c8-9cfd-4677-80cc-f6ac6fde780e", tema: "Clínica Médica", subtema: "Gastroenterologia" },
  { pk: "5ba280b7-d8c6-4d59-a44b-9784fe327b6e", tema: "Clínica Médica", subtema: "Cardiologia" },
  { pk: "5c987fff-8bae-4143-b3e7-5a509df02ad4", tema: "Clínica Médica", subtema: "Oncologia / Hematologia" },
  { pk: "97718ec4-4be5-46d4-aa27-d44bcede9409", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "9e0531fb-d03f-4b14-84da-e2a61cd5f913", tema: "Clínica Médica", subtema: "Cardiologia" },
  { pk: "857899f3-3e62-4d39-94a2-673e5b422c15", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "e31cf07c-c89d-460f-82dd-cf8cbac83d96", tema: "Clínica Médica", subtema: "Oftalmologia" },
  { pk: "59393a02-1f74-48e4-9d8d-a39a50e08fe3", tema: "Clínica Médica", subtema: "Cardiologia" },
  { pk: "84818efe-5f56-4e7d-bf87-20a9ce4648a8", tema: "Clínica Médica", subtema: "Hematologia" },
  { pk: "4531b607-0838-4245-9508-29d4615f83aa", tema: "Clínica Médica", subtema: "Cardiologia" },
  { pk: "f73f4828-9c63-4c1c-961b-4d1d1de8c871", tema: "Ginecologia e Obstetrícia", subtema: "Ginecologia Geral" },
  { pk: "fafe5f92-2e9d-4f31-af14-295d335c2006", tema: "Ginecologia e Obstetrícia", subtema: "Ginecologia Geral" },
  { pk: "dd601c1f-189f-413b-b31d-8977e294c5f6", tema: "Clínica Médica", subtema: "Cardiologia" },
  { pk: "5cef4f68-1589-4b47-9585-c9c6fca994f4", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "c6e617d1-8350-464a-9e69-1b06c4e523eb", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  { pk: "3088245a-d178-469b-a0c3-295a2451f5c3", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  { pk: "c64433c1-57a1-4abb-986f-c25e590b25c7", tema: "Medicina Preventiva", subtema: "Políticas Públicas de Saúde" },
  { pk: "d825a5b6-34ea-4d8b-8267-5b4dd7347ae7", tema: "Clínica Médica", subtema: "Endocrinologia" },
  { pk: "75848e53-87e4-4656-a9e9-c17108ffcb14", tema: "Clínica Médica", subtema: "Nefrologia / Urologia" },
  { pk: "97ef2e14-db20-456d-b605-74dce0696c71", tema: "Pediatria", subtema: "Hematologia / Oncologia Pediátrica" },
  { pk: "92347219-d17b-432a-9d5b-9e75ac6223bb", tema: "Clínica Médica", subtema: "Cardiologia" },
  { pk: "c1d1d3af-827c-4129-b852-0d4ffd20080b", tema: "Clínica Médica", subtema: "Ortopedia / Reumatologia" },
  { pk: "695d53da-f93a-40bc-8aea-7be3481355ae", tema: "Medicina Preventiva", subtema: "Ética Médica" },
  { pk: "9d99f410-8244-48b5-bdba-d4bd5d65fa7b", tema: "Clínica Médica", subtema: "Pneumologia" },
  { pk: "0dafabbb-0a57-4237-9f71-0b2a143578fe", tema: "Clínica Médica", subtema: "Pneumologia" },
  { pk: "e546a5f8-9160-415b-a748-e4d2b1f3e92b", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "41ac5435-6772-4107-8fd2-1dec418a404e", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "d3f7b1d2-5f08-41bf-b2f6-de6fd3077b3b", tema: "Clínica Médica", subtema: "Oftalmologia" },
  { pk: "bf661051-5063-4e86-9d90-522fdcb8dc49", tema: "Cirurgia", subtema: "Feridas / Técnica Cirúrgica" },
  { pk: "d9b8cbc2-b5b8-4e09-862f-778cffc3b91f", tema: "Pediatria", subtema: "Infectologia Pediátrica" },
]

let ok = 0, err = 0
for (const c of correcoes) {
  const { error } = await supabase.from("questoes").update({ tema: c.tema, subtema: c.subtema }).eq("pk", c.pk)
  if (error) { console.error(`ERRO pk=${c.pk}:`, error.message); err++ }
  else { console.log(`OK pk=${c.pk} → ${c.tema} > ${c.subtema}`); ok++ }
}
console.log(`\nParte 2: ${ok} corrigidas, ${err} erros`)
