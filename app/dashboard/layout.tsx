import type React from "react"
import { SessionGuard } from "@/components/session-guard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SessionGuard>{children}</SessionGuard>
}
