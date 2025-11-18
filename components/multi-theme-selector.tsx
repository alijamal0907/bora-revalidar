'use client';

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { getUniqueThemes } from '@/lib/storage-supabase';

// Mapeamento de temas formatados para temas do banco de dados
const THEME_MAPPING: { [key: string]: string } = {
  'Clínica Médica': 'clinica medica',
  'Cirurgia': 'cirurgia',
  'Pediatria': 'pediatria',
  'Ginecologia e Obstetrícia': 'ginecologia e obstetricia',
  'Medicina Preventiva': 'medicina preventiva',
  'Medicina da Família': 'medicina da familia',
  'Psiquiatria': 'psiquiatria',
};

interface MultiThemeSelectorProps {
  selectedThemes: string[];
  onThemesChange: (themes: string[]) => void;
}

export function MultiThemeSelector({ selectedThemes, onThemesChange }: MultiThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadThemes = async () => {
      try {
        const themes = await getUniqueThemes();
        console.log('[v0] Real themes from Supabase:', themes);
        setAvailableThemes(themes);
      } catch (error) {
        console.error('[v0] Error loading themes:', error);
        // Fallback para temas do mapeamento se falhar
        setAvailableThemes(Object.values(THEME_MAPPING));
      } finally {
        setLoading(false);
      }
    };
    loadThemes();
  }, []);

  const toggleTheme = (theme: string) => {
    if (selectedThemes.includes(theme)) {
      onThemesChange(selectedThemes.filter((t) => t !== theme));
    } else {
      onThemesChange([...selectedThemes, theme]);
    }
  };

  const selectAll = () => {
    onThemesChange(availableThemes);
  };

  const clearAll = () => {
    onThemesChange([]);
  };

  const formatThemeDisplay = (theme: string) => {
    return theme
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Carregando temas...</div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedThemes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum tema selecionado</p>
        ) : (
          selectedThemes.map((theme) => (
            <div
              key={theme}
              className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium"
            >
              {formatThemeDisplay(theme)}
              <button
                onClick={() => toggleTheme(theme)}
                className="hover:opacity-70 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-card border border-border rounded-lg text-left text-foreground font-medium hover:bg-muted/50 transition-colors"
      >
        {selectedThemes.length === 0
          ? 'Selecione os temas'
          : `${selectedThemes.length} tema(s) selecionado(s)`}
      </button>

      {isOpen && (
        <div className="bg-card border border-border rounded-lg shadow-lg p-4 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="flex-1 px-3 py-2 bg-primary/10 text-primary text-sm font-medium rounded hover:bg-primary/20 transition-colors"
            >
              Selecionar Todos
            </button>
            <button
              onClick={clearAll}
              className="flex-1 px-3 py-2 bg-muted text-foreground text-sm font-medium rounded hover:bg-muted/80 transition-colors"
            >
              Limpar
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableThemes.map((theme) => (
              <label
                key={theme}
                className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedThemes.includes(theme)}
                  onChange={() => toggleTheme(theme)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-foreground text-sm">{formatThemeDisplay(theme)}</span>
                {selectedThemes.includes(theme) && (
                  <Check className="w-4 h-4 text-primary ml-auto" />
                )}
              </label>
            ))}
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded hover:bg-primary/90 transition-colors"
          >
            Confirmar
          </button>
        </div>
      )}
    </div>
  );
}
