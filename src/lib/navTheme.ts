export const NAV_THEME_KEY = 'esoterica_nav_theme_v1'
export type NavTheme = 'crossroads' | 'standard'

export function getNavTheme(): NavTheme {
  try {
    const v = localStorage.getItem(NAV_THEME_KEY)
    if (v === 'standard') return 'standard'
  } catch {}
  return 'crossroads'
}

export function setNavTheme(theme: NavTheme) {
  try {
    localStorage.setItem(NAV_THEME_KEY, theme)
  } catch {}
}
