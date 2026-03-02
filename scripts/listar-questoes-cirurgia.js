import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data, error } = await supabase
  .from('questoes')
  .select('pk, id, tema, subtema, enunciado')
  .eq('tema', 'Cirurgia')
  .order('subtema')
  .limit(2000)

if (error) { console.error(error); process.exit(1) }

console.log(`Total Cirurgia: ${data.length} questões\n`)

let currentSub = ''
for (const q of data) {
  if (q.subtema !== currentSub) {
    currentSub = q.subtema
    console.log(`\n=== SUBTEMA: ${currentSub} ===`)
  }
  const resumo = (q.enunciado || '').replace(/\s+/g, ' ').substring(0, 180)
  console.log(`  [pk:${q.pk}] ${resumo}`)
}
