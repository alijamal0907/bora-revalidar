"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Download, Smartphone } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(userAgent)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true

    setIsIOS(ios)
    setIsStandalone(standalone)

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Verificar se usuário já recusou antes
      const dismissed = localStorage.getItem("pwa-install-dismissed")
      const dismissedDate = dismissed ? new Date(dismissed).getTime() : 0
      const daysSinceDismiss = (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24)

      // Mostrar popup se não foi recusado ou se já se passaram 7 dias
      if (!dismissed || daysSinceDismiss > 7) {
        setTimeout(() => setShowInstallPrompt(true), 3000) // Mostrar após 3s
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    if (ios && !standalone) {
      const dismissed = localStorage.getItem("pwa-install-dismissed")
      const dismissedDate = dismissed ? new Date(dismissed).getTime() : 0
      const daysSinceDismiss = (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24)

      if (!dismissed || daysSinceDismiss > 7) {
        setTimeout(() => setShowInstallPrompt(true), 3000)
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      console.log("[PWA] User accepted install")
    }

    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", new Date().toISOString())
    setShowInstallPrompt(false)
  }

  if (isStandalone || !showInstallPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5">
      <div className="mx-auto max-w-md bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow-2xl p-4 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="flex-shrink-0 bg-white/20 p-2 rounded-lg">
            <Smartphone className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Instale o App Bora Revalidar</h3>

            {isIOS ? (
              <div className="text-sm text-white/90 space-y-2">
                <p>Para instalar no iPhone/iPad:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Toque no botão de compartilhar no Safari</li>
                  <li>Role e selecione "Adicionar à Tela de Início"</li>
                  <li>Toque em "Adicionar"</li>
                </ol>
              </div>
            ) : (
              <>
                <p className="text-sm text-white/90 mb-3">
                  Acesse o app direto da tela inicial do seu celular, sem precisar do navegador!
                </p>

                <Button
                  onClick={handleInstallClick}
                  className="w-full bg-white text-orange-600 hover:bg-white/90 font-semibold"
                  disabled={!deferredPrompt}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar App
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
