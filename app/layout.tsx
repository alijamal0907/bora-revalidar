import type React from "react"
import "./globals.css"
import { PWAInstaller } from "./pwa-installer"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* PWA Primary Tags */}
        <meta name="application-name" content="Bora Revalidar" />
        <meta name="theme-color" content="#f97316" />
        <link rel="manifest" href="/manifest.json" />

        {/* Android Tags */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS Tags */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Bora Revalidar" />

        {/* Viewport */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover, user-scalable=yes"
        />

        {/* SEO */}
        <title>Bora Revalidar</title>
        <meta name="description" content="App de estudos para o REVALIDA, com questões, progresso e revisão." />
      </head>
      <body>
        <PWAInstaller />
        {children}
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.app'
    };
