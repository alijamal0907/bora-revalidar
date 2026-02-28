import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data, error } = await supabase
  .from('questoes')
  .select('tema')

if (error) {
  console.error('Erro:', error.message)
  process.exit(1)
}

const counts = {}
for (const row of data) {
  const tema = row.tema || '(sem tema)'
  counts[tema] = (counts[tema] || 0) + 1
}

const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])

console.log('\n=== QUESTÕES POR TEMA ===\n')
let total = 0
for (const [tema, count] of sorted) {
  console.log(`${tema}: ${count}`)
  total += count
}
console.log(`\nTOTAL GERAL: ${total}`)
