import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if webhook secret is configured
    const webhookSecret = process.env.CAKTO_WEBHOOK_SECRET

    return NextResponse.json({
      healthy: !!webhookSecret,
      message: webhookSecret ? "Webhook endpoint configured and ready" : "Webhook secret not configured",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        healthy: false,
        message: error instanceof Error ? error.message : "Webhook check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
