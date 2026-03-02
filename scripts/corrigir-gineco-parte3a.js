import { createClient } from "@supabase/supabase-js"
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const correcoes = [
  { pk: "84517e59-8edf-4dd2-95c5-d57048a2bdf7", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  { pk: "7e980795-7300-46c4-82d5-ebb8c586dadb", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  { pk: "89fb5335-a230-437c-aefb-f16f725f1f2f", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "62482b54-730f-4500-900d-6a9d9c053bc3", tema: "Clínica Médica", subtema: "Infectologia" },
  { pk: "f3a2d6bf-2d45-448b-8a66-b27ad2523c64", tema: "Clínica Médica", subtema: "Neurologia" },
  { pk: "7c2d8038-d624-414c-bba8-b4da72f8c038", tema: "Clínica Médica", subtema: "Infectologia" },
  { pk: "545de25a-856d-4272-9a92-d6d0369d53f4", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  { pk: "a3b20aa1-3f32-47e6-8d03-a29bfbfc9604", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "882c8a94-e3e7-4855-b0bd-482fefc9877f", tema: "Medicina Preventiva", subtema: "Epidemiologia" },
  { pk: "be2a75fc-c05b-40bb-8a15-b7730f2475d9", tema: "Clínica Médica", subtema: "Cardiologia" },
  { pk: "8fb7e3e0-f388-4f57-8b82-8d745fc06e6b", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "fc62f604-103c-4268-a311-5361e0f645a9", tema: "Cirurgia", subtema: "Oncologia Cirúrgica" },
  { pk: "a2afec71-eb55-45e8-a9af-aced04413633", tema: "Clínica Médica", subtema: "Pneumologia" },
  { pk: "be43f7cf-5515-4716-a57a-612775cc79ba", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  { pk: "960d33af-0652-42cc-9556-b1fd16be3442", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  { pk: "1c38182f-4110-463c-8998-8ce5dfa55645", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  { pk: "5cc94218-44b9-48ae-8c8c-f5934014bb90", tema: "Clínica Médica", subtema: "Gastroenterologia" },
  { pk: "9b3966e2-e618-48b0-b0af-e195e0bff68c", tema: "Clínica Médica", subtema: "Infectologia" },
  { pk: "cd9e9eec-668e-448e-953e-9bad56fcaa90", tema: "Clínica Médica", subtema: "Psiquiatria" },
  { pk: "7597d753-bcc6-4cf6-ac8e-74f02d5c6355", tema: "Clínica Médica", subtema: "Cardiologia" },
  { pk: "578095d8-bfcc-43ec-8cda-4868df84a6cb", tema: "Clínica Médica", subtema: "Cardiologia" },
  { pk: "f550ee37-ef45-449c-b95c-1dbc741ee76f", tema: "Clínica Médica", subtema: "Cardiologia" },
  { pk: "64aff439-a4f0-460d-a9cd-29ad7061f8c2", tema: "Medicina Preventiva", subtema: "Epidemiologia" },
  { pk: "d75f60b2-b91b-4ae1-836b-a5d44ecb0aac", tema: "Clínica Médica", subtema: "Cardiologia" },
  { pk: "97675f66-6aae-4fd8-a007-77b8e971339b", tema: "Clínica Médica", subtema: "Pneumologia" },
  { pk: "6475a6c4-b0ac-4b6d-ae56-e92abc1c758b", tema: "Clínica Médica", subtema: "Oftalmologia" },
  { pk: "6514f85c-3685-4645-a84c-f0ac30dd9624", tema: "Medicina Preventiva", subtema: "Epidemiologia" },
  { pk: "2c4cab5c-77ff-4f66-8287-38d35772f20e", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  { pk: "dd2ec2c3-7659-4c0e-8d4d-107da53d3e87", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  { pk: "cf874449-fc06-4385-a755-753dc504b894", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  { pk: "6d5533de-1d01-480a-8e25-51ae3fe708d8", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  { pk: "8213e80c-8e71-400d-93a8-cf3f1ca957c9", tema: "Medicina Preventiva", subtema: "Políticas Públicas de Saúde" },
  { pk: "c36bcf4f-c7a7-48ac-a66e-8561b88c918d", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "cdf9ea81-651b-4ad2-a958-a520afe870ed", tema: "Clínica Médica", subtema: "Infectologia" },
  { pk: "2673706d-2455-4069-a306-bc9e99f838e6", tema: "Clínica Médica", subtema: "Endocrinologia" },
  { pk: "29c08c2c-3955-4481-89f1-e4f35d217f44", tema: "Clínica Médica", subtema: "Psiquiatria" },
  { pk: "2ffb0404-d476-4aea-98c5-e7ca5c90a076", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "4ce9e6a3-1a11-401c-8aba-d59ec874408d", tema: "Pediatria", subtema: "Urgências Pediátricas" },
  { pk: "a30fcc03-ec40-40a6-8187-feb9bc6ee424", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  { pk: "24c74f98-3e0b-4d65-b92b-3ab32e511e0c", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  { pk: "90bb24d4-91e7-4243-80b4-d9d78e070a6b", tema: "Clínica Médica", subtema: "Pneumologia" },
  { pk: "570f3143-2f9b-42fc-9ac6-8baa7e867920", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "7bcb3ce3-2d0e-4bff-ac43-ed1de1922fb3", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  { pk: "80e48517-46b9-4f9c-ae98-284c9e5c7dfe", tema: "Clínica Médica", subtema: "Pneumologia" },
  { pk: "f8321451-80dc-4a38-a00b-d0052c6291ae", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  { pk: "8dae3461-15e4-4352-a96a-9dbae855cab5", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  { pk: "e28ddcf1-7ccd-40bc-9de0-5a686675255d", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  { pk: "d219f4eb-f241-4b31-9f39-efe5dd3b3ecf", tema: "Clínica Médica", subtema: "Infectologia" },
  { pk: "0f5b36b7-43b8-4991-a50d-db07be572ef6", tema: "Medicina Preventiva", subtema: "Epidemiologia" },
  { pk: "ed5d06b9-cbf9-4947-8048-82b828bd407f", tema: "Pediatria", subtema: "Infectologia Pediátrica" },
]

let ok = 0, err = 0
for (const c of correcoes) {
  const { error } = await supabase.from("questoes").update({ tema: c.tema, subtema: c.subtema }).eq("pk", c.pk)
  if (error) { console.error(`ERRO pk=${c.pk}:`, error.message); err++ }
  else { ok++ }
}
console.log(`Parte 3a: ${ok} corrigidas, ${err} erros`)
