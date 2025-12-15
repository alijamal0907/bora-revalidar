export const dynamic = "force-dynamic"

import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return Response.json({ error: "Prompt é obrigatório" }, { status: 400 })
    }

    const { text } = await generateText({
      model: "openai/gpt-4o",
      prompt,
      temperature: 0.7,
      maxTokens: 1000,
    })

    return Response.json({ explicacao: text })
  } catch (error) {
    console.error("Erro ao gerar explicação:", error)
    return Response.json({ error: "Erro ao gerar explicação" }, { status: 500 })
  }
}
