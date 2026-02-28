import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase
  .from("questoes")
  .select("id, subtema")
  .eq("tema", "Medicina Preventiva");

if (error) { console.error(error.message); process.exit(1); }

const cont = {};
for (const r of data) {
  const s = r.subtema?.trim() || "(sem subtema)";
  cont[s] = (cont[s] || 0) + 1;
}

console.log(`Total: ${data.length}\n`);
for (const [s, q] of Object.entries(cont).sort((a, b) => b[1] - a[1])) {
  console.log(`[${q}] ${s}`);
}
