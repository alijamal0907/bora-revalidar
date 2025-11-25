import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Test auth service availability
    const { data, error } = await supabase.auth.getSession()

    return NextResponse.json({
      healthy: true,
      message: "Auth service operational",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        healthy: false,
        message: error instanceof Error ? error.message : "Auth service unavailable",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
