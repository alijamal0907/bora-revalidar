"use client"

import type React from "react"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { useEffect } from "react"
import { registerServiceWorker } from "./register-sw"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

// Note: Em Client Components, metadata precisa ser exportada de um Server Component
// Vamos criar um wrapper ou usar a estrutura adequada

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Registra Service Worker quando o app carrega
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return (
    <>
      {children}
      <Analytics />
    </>
  )
}
