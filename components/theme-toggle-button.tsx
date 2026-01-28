'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors"
        aria-label="Toggle theme"
      >
        <Moon className="w-5 h-5 text-muted-foreground" />
      </button>
    )
  }

  const isLight = theme === 'light'

  return (
    <button
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
      className="p-2 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors group"
      aria-label={isLight ? 'Mudar para modo escuro' : 'Mudar para modo claro'}
      title={isLight ? 'Modo Escuro' : 'Modo Claro'}
    >
      {isLight ? (
        <Sun className="w-5 h-5 text-primary group-hover:rotate-90 transition-transform duration-300" />
      ) : (
        <Moon className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform duration-300" />
      )}
    </button>
  )
}
