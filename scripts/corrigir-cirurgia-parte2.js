import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const correcoes = [
  // "Urgências Clínicas / Outros" erros
  { pk: 'e191f539-ae72-4aea-a2ad-c715dc343213', tema: 'Clínica Médica', subtema: 'Reumatologia' },
  { pk: '3a6db966-0847-44e5-9d33-25e603651c8c', tema: 'Clínica Médica', subtema: 'Pneumologia' },
  { pk: 'dee71021-cfbd-48fa-bbb4-10bfe632d155', tema: 'Cirurgia', subtema: 'Trauma / ATLS' },
  { pk: 'e018e2e8-9fea-446f-8162-32cfcf268958', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  { pk: 'd4a8ff43-d15c-45a2-b0e7-0937925a1c0c', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  { pk: 'fbacc46b-d922-43f6-8774-805fef7dc105', tema: 'Cirurgia', subtema: 'Oncologia Cirúrgica' },
  { pk: '86825439-6ff2-48f0-8f06-b045fd20b30e', tema: 'Pediatria', subtema: 'Hematologia Pediátrica' },
  { pk: '592a93cc-0f54-40c6-8ec1-ca6b6f58885d', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  { pk: 'de348ad0-4d37-4def-ab3a-60eb98956017', tema: 'Cirurgia', subtema: 'Trauma / ATLS' },
  { pk: 'de439195-4fe0-4ba4-9803-bea8cfab3662', tema: 'Medicina Preventiva', subtema: 'Atenção Primária à Saúde (APS)' },
  { pk: '372315eb-ea51-4f5b-bc5a-0860d0a01997', tema: 'Cirurgia', subtema: 'Trauma / ATLS' },
  { pk: 'c8766b14-5ef3-4536-8fea-866c707e1fa1', tema: 'Pediatria', subtema: 'Infectologia Pediátrica' },
  { pk: '8c89cef8-e9cc-436d-8101-3df9837119b6', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  { pk: '16ad3658-1bfb-4887-aff5-c22cce233f4e', tema: 'Cirurgia', subtema: 'Oncologia Cirúrgica' },
  { pk: '0c1fd427-b605-494a-94a7-f6eee93b36e3', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  { pk: 'c4115abe-bf02-4754-b51a-90386dfdf476', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  { pk: '483ab47a-a004-4c34-999d-296915b979ff', tema: 'Pediatria', subtema: 'Urgências Pediátricas' },
  { pk: '95ba0c67-4cbb-42ca-a138-8c2a1e8a20c7', tema: 'Clínica Médica', subtema: 'Endocrinologia' },
  { pk: 'c8c398fc-4da3-4b43-935a-69608dd58db5', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  { pk: 'ea59ca3c-c209-4f14-adbb-c55831870534', tema: 'Cirurgia', subtema: 'Trauma / ATLS' },
  { pk: '025f6d70-2147-4521-a09c-9683cf3de80f', tema: 'Clínica Médica', subtema: 'Reumatologia' },
  { pk: '08b47c68-4ccf-4324-9bbb-e4d668805e96', tema: 'Clínica Médica', subtema: 'Psiquiatria' },
  { pk: 'a5b4f2dc-ab3e-4092-bc24-a02fe0a27fa7', tema: 'Pediatria', subtema: 'Urgências Pediátricas' },
  { pk: 'cef0af39-417d-4d9a-82a5-9ad9cd52bac8', tema: 'Medicina Preventiva', subtema: 'Políticas Públicas de Saúde' },
  { pk: 'ac688257-7bf7-4a7b-8b2f-3b8b5a3df284', tema: 'Clínica Médica', subtema: 'Pneumologia' },
  { pk: '106aed5b-e191-4f96-a85f-8cc0e9f0b77c', tema: 'Medicina Preventiva', subtema: 'Epidemiologia' },
  { pk: '6439d2e4-cab1-4360-9898-519135ae40bc', tema: 'Ginecologia e Obstetrícia', subtema: 'Ginecologia Geral' },
  { pk: '0e4189e7-5fdf-44cd-a143-7744f7c24e8a', tema: 'Clínica Médica', subtema: 'Pneumologia' },
  { pk: 'd7cfa496-c298-4235-8199-ba0f4089d189', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  { pk: 'ca8844e3-5c75-4d77-86f2-b37693b7abd8', tema: 'Ginecologia e Obstetrícia', subtema: 'Ginecologia Geral' },
  { pk: '351d61dd-c1c1-47d5-a52b-f73d8872381d', tema: 'Clínica Médica', subtema: 'Pneumologia' },
  { pk: '88d4be3c-2a6f-4202-a51a-753567f83bc5', tema: 'Clínica Médica', subtema: 'Cardiologia' },
  // Urologia
  { pk: 'b897ffb0-9405-4fb3-ac67-1123a3862a56', tema: 'Cirurgia', subtema: 'Oncologia Cirúrgica' },
]

console.log(`Parte 2: ${correcoes.length} correções`)
let s = 0, e = 0
for (const c of correcoes) {
  const { error } = await supabase.from('questoes').update({ tema: c.tema, subtema: c.subtema }).eq('pk', c.pk)
  if (error) { console.error(`ERRO pk=${c.pk}: ${error.message}`); e++ } else s++
}
console.log(`Resultado parte 2: ${s} OK, ${e} erros`)
