import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const { data, error } = await supabase
  .from('questoes')
  .select('pk, id, subtema, enunciado')
  .eq('tema', 'Medicina Preventiva')
  .order('subtema')
  .limit(2000)

if (error) { console.log('ERRO:', error.message); process.exit(1) }

console.log(`Total Medicina Preventiva: ${data.length} questoes\n`)

let currentSubtema = ''
for (const q of data) {
  if (q.subtema !== currentSubtema) {
    currentSubtema = q.subtema
    console.log(`\n=== SUBTEMA: ${q.subtema} ===`)
  }
  const resumo = (q.enunciado || '').substring(0, 120).replace(/\n/g, ' ')
  console.log(`  [pk=${q.pk}] [id=${q.id}] ${resumo}`)
}
