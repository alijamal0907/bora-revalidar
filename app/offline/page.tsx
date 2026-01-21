'use client';

import { WifiOff } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
            <WifiOff className="w-12 h-12 text-muted-foreground" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Você está offline
        </h1>
        
        <p className="text-muted-foreground mb-6">
          Parece que você perdeu a conexão com a internet. Verifique sua conexão e tente novamente.
        </p>
        
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
