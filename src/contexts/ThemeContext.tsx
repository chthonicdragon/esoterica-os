// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { type ThemeDefinition, DEFAULT_THEME } from '../lib/themeRegistry';
import { getActiveTheme, saveActiveTheme } from '../services/themeService';
import { useUser } from './UserContext';
import { soundManager } from '../lib/soundManager';

interface ThemeContextType {
  theme: ThemeDefinition;
  setTheme: (theme: ThemeDefinition) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [theme, setThemeState] = useState<ThemeDefinition>(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme on mount or when user changes
  useEffect(() => {
    async function loadTheme() {
      const activeTheme = await getActiveTheme(user?.id);
      setThemeState(activeTheme);
      setIsLoading(false);
    }
    loadTheme();
  }, [user?.id]);

  // Apply theme colors to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const colors = theme.colors;

    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    // Handle music swap
    if (theme.musicTrack) {
      soundManager.setMusicTrack(theme.musicTrack);
    }
  }, [theme]);

  const setTheme = async (newTheme: ThemeDefinition) => {
    setThemeState(newTheme);
    await saveActiveTheme(newTheme.id, user?.id);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
