export const NAV_THEME_KEY = 'esoterica_nav_theme_v1'
export const CROSSROADS_SIDEBAR_MODE_KEY = 'esoterica_crossroads_sidebar_mode_v1'
export type NavTheme = 'crossroads' | 'standard'
export type CrossroadsSidebarMode = 'show' | 'hide'

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

export function getCrossroadsSidebarMode(): CrossroadsSidebarMode {
  try {
    const v = localStorage.getItem(CROSSROADS_SIDEBAR_MODE_KEY)
    if (v === 'show') return 'show'
  } catch {}
  return 'hide'
}

export function setCrossroadsSidebarMode(mode: CrossroadsSidebarMode) {
  try {
    localStorage.setItem(CROSSROADS_SIDEBAR_MODE_KEY, mode)
  } catch {}
}
