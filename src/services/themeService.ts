// src/services/themeService.ts
// Handles persistence of theme preferences

import { supabase } from '../lib/supabaseClient';
import { BUILTIN_THEMES, DEFAULT_THEME, type ThemeDefinition } from '../lib/themeRegistry';

const THEME_STORAGE_KEY = 'eos_active_theme_id';

export async function getActiveTheme(userId?: string): Promise<ThemeDefinition> {
  // 1. Try local storage first for instant load
  const localId = typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null;
  
  // 2. If we have a userId, try to fetch from Supabase
  if (userId) {
    try {
      const { data, error } = await supabase
        .from('userProfiles')
        .select('themeId')
        .eq('userId', userId)
        .single();
      
      if (!error && data?.themeId) {
        const remoteTheme = BUILTIN_THEMES.find(t => t.id === data.themeId);
        if (remoteTheme) {
          // Update local storage to match remote
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(THEME_STORAGE_KEY, remoteTheme.id);
          }
          return remoteTheme;
        }
      }
    } catch (e) {
      console.warn('[ThemeService] Error fetching remote theme:', e);
    }
  }

  // 3. Fallback to localId or default
  const localTheme = BUILTIN_THEMES.find(t => t.id === localId);
  return localTheme || DEFAULT_THEME;
}

export async function saveActiveTheme(themeId: string, userId?: string): Promise<void> {
  // 1. Save to local storage
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  }

  // 2. Save to Supabase if userId is provided
  if (userId) {
    try {
      const { error } = await supabase
        .from('userProfiles')
        .update({ 
          themeId,
          updatedAt: new Date().toISOString() 
        })
        .eq('userId', userId);
      
      if (error) throw error;
    } catch (e) {
      console.error('[ThemeService] Error saving remote theme:', e);
    }
  }
}
