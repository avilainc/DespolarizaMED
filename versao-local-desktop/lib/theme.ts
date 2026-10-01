export const THEME_KEY = 'despolarizamed_theme'
export type Theme = 'dark' | 'light'

export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // ignora storage indisponível
  }
  return 'dark'
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // ignora storage indisponível
  }
}

// Script inline injetado no <head> pra aplicar o tema salvo antes da
// primeira pintura — evita flash de tema errado ao carregar.
export const THEME_INIT_SCRIPT = `
(function() {
  try {
    var t = localStorage.getItem('${THEME_KEY}');
    if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
  } catch (e) {}
})();
`
