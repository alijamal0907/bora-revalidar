'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getUniqueThemes } from '@/lib/storage-supabase';

interface ThemeSelectorProps {
  onThemeSelect: (theme: string | null) => void;
  selectedTheme: string | null;
}

export function ThemeSelector({ onThemeSelect, selectedTheme }: ThemeSelectorProps) {
  const [themes, setThemes] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadThemes = async () => {
      try {
        const fetchedThemes = await getUniqueThemes();
        setThemes(fetchedThemes);
      } catch (error) {
        console.error('[v0] Error loading themes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemes();
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-card border border-border rounded-lg text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <span className="text-foreground font-medium">
          {selectedTheme || 'Todos os temas'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50">
          <button
            onClick={() => {
              onThemeSelect(null);
              setIsOpen(false);
            }}
            className={`w-full px-4 py-2 text-left hover:bg-muted transition-colors ${
              !selectedTheme ? 'bg-primary/10 text-primary' : 'text-foreground'
            }`}
          >
            Todos os temas
          </button>
          {isLoading ? (
            <div className="px-4 py-2 text-muted-foreground text-sm">Carregando...</div>
          ) : themes.length === 0 ? (
            <div className="px-4 py-2 text-muted-foreground text-sm">Nenhum tema encontrado</div>
          ) : (
            themes.map((theme) => (
              <button
                key={theme}
                onClick={() => {
                  onThemeSelect(theme);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-muted transition-colors ${
                  selectedTheme === theme ? 'bg-primary/10 text-primary' : 'text-foreground'
                }`}
              >
                {theme}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
