import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-supabase"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }
    return NextResponse.json({ id: user.id, email: user.email })
  } catch (error) {
    console.error("Erro ao buscar usuário:", error)
    return NextResponse.json({ error: "Erro ao buscar usuário" }, { status: 500 })
  }
}
