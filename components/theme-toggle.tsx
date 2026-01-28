'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <Moon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium">Tema</h3>
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  const isLight = theme === 'light'

  return (
    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-muted rounded-lg">
          {isLight ? (
            <Sun className="w-5 h-5 text-foreground" />
          ) : (
            <Moon className="w-5 h-5 text-foreground" />
          )}
        </div>
        <div>
          <h3 className="font-medium">Tema</h3>
          <p className="text-sm text-muted-foreground">
            {isLight ? 'Modo Claro' : 'Modo Escuro'}
          </p>
        </div>
      </div>

      <button
        onClick={() => setTheme(isLight ? 'dark' : 'light')}
        className="relative inline-flex h-8 w-14 items-center rounded-full bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        role="switch"
        aria-checked={isLight}
        aria-label="Alternar tema"
      >
        <span
          className={`${
            isLight ? 'translate-x-7' : 'translate-x-1'
          } inline-flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-lg ring-0 transition-transform`}
        >
          {isLight ? (
            <Sun className="w-4 h-4 text-primary" />
          ) : (
            <Moon className="w-4 h-4 text-primary" />
          )}
        </span>
      </button>
    </div>
  )
}
