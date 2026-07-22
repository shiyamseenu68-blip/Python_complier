export interface ThemeDef {
  id: string;
  name: string;
  monacoBase: 'vs-dark' | 'vs';
  isDark: boolean;
  bg: string;
  surface: string;
  elevated: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  swatch: string;
}

export const THEMES: ThemeDef[] = [
  { id: 'tokyo-night', name: 'Tokyo Night', monacoBase: 'vs-dark', isDark: true, bg: '#1a1b26', surface: '#16161e', elevated: '#1f2335', border: '#2a2a3e', text: '#a9b1d6', muted: '#565f89', accent: '#7aa2f7', success: '#9ece6a', warning: '#e0af68', error: '#f7768e', swatch: '#7aa2f7' },
  { id: 'one-dark', name: 'One Dark Pro', monacoBase: 'vs-dark', isDark: true, bg: '#282c34', surface: '#21252b', elevated: '#2c313a', border: '#3b4048', text: '#abb2bf', muted: '#5c6370', accent: '#61afef', success: '#98c379', warning: '#e5c07b', error: '#e06c75', swatch: '#61afef' },
  { id: 'catppuccin', name: 'Catppuccin Mocha', monacoBase: 'vs-dark', isDark: true, bg: '#1e1e2e', surface: '#181825', elevated: '#313244', border: '#45475a', text: '#cdd6f4', muted: '#7f849c', accent: '#89b4fa', success: '#a6e3a1', warning: '#f9e2af', error: '#f38ba8', swatch: '#89b4fa' },
  { id: 'nord', name: 'Nord', monacoBase: 'vs-dark', isDark: true, bg: '#2e3440', surface: '#272e3b', elevated: '#3b4252', border: '#434c5e', text: '#d8dee9', muted: '#616e88', accent: '#88c0d0', success: '#a3be8c', warning: '#ebcb8b', error: '#bf616a', swatch: '#88c0d0' },
  { id: 'dracula', name: 'Dracula', monacoBase: 'vs-dark', isDark: true, bg: '#282a36', surface: '#21222c', elevated: '#343746', border: '#44475a', text: '#f8f8f2', muted: '#6272a4', accent: '#bd93f9', success: '#50fa7b', warning: '#f1fa8c', error: '#ff5555', swatch: '#bd93f9' },
  { id: 'github-dark', name: 'GitHub Dark', monacoBase: 'vs-dark', isDark: true, bg: '#0d1117', surface: '#161b22', elevated: '#21262d', border: '#30363d', text: '#e6edf3', muted: '#7d8590', accent: '#2f81f7', success: '#3fb950', warning: '#d29922', error: '#f85149', swatch: '#2f81f7' },
  { id: 'monokai', name: 'Monokai Pro', monacoBase: 'vs-dark', isDark: true, bg: '#2d2a2e', surface: '#262427', elevated: '#363337', border: '#403e41', text: '#fcfcfa', muted: '#727073', accent: '#ff6188', success: '#a9dc76', warning: '#ffd866', error: '#ff6188', swatch: '#ff6188' },
  { id: 'synthwave', name: "SynthWave '84", monacoBase: 'vs-dark', isDark: true, bg: '#262335', surface: '#1e1c2e', elevated: '#2d2b3f', border: '#3b3850', text: '#c3c3c3', muted: '#7a7a7a', accent: '#ff7edb', success: '#ff8b39', warning: '#fede5d', error: '#fb94ff', swatch: '#ff7edb' },
  { id: 'ayu-mirage', name: 'Ayu Mirage', monacoBase: 'vs-dark', isDark: true, bg: '#1f2430', surface: '#1a1f2b', elevated: '#242b38', border: '#2d3441', text: '#cccac2', muted: '#6c7380', accent: '#ffcc66', success: '#bae67e', warning: '#ffcc66', error: '#f07178', swatch: '#ffcc66' },
  { id: 'night-owl', name: 'Night Owl', monacoBase: 'vs-dark', isDark: true, bg: '#011627', surface: '#0b2942', elevated: '#0e3251', border: '#1d3b53', text: '#d6deeb', muted: '#5f7e97', accent: '#82aaff', success: '#addb67', warning: '#ffcb8b', error: '#ef5350', swatch: '#82aaff' },
  { id: 'material-ocean', name: 'Material Ocean', monacoBase: 'vs-dark', isDark: true, bg: '#0f111a', surface: '#181926', elevated: '#1f2233', border: '#3b4048', text: '#a9acbd', muted: '#5c6370', accent: '#84ffff', success: '#c3e88d', warning: '#ffcb6b', error: '#ff5370', swatch: '#84ffff' },
  { id: 'pure-black', name: 'Pure Black (AMOLED)', monacoBase: 'vs-dark', isDark: true, bg: '#000000', surface: '#000000', elevated: '#0a0a0a', border: '#1a1a1a', text: '#e0e0e0', muted: '#505050', accent: '#3b82f6', success: '#22c55e', warning: '#eab308', error: '#ef4444', swatch: '#3b82f6' },
  { id: 'midnight', name: 'Midnight Sapphire', monacoBase: 'vs-dark', isDark: true, bg: '#0a0e27', surface: '#0d1133', elevated: '#141845', border: '#1e2260', text: '#c5d0e6', muted: '#6a7ba5', accent: '#4d8af5', success: '#5fd3bc', warning: '#f5d44d', error: '#f55f6e', swatch: '#4d8af5' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', monacoBase: 'vs-dark', isDark: true, bg: '#0a0a0f', surface: '#11111b', elevated: '#1a1a2e', border: '#2a2a3e', text: '#e0e0ff', muted: '#6666aa', accent: '#00ff9f', success: '#00ff9f', warning: '#ffcc00', error: '#ff0066', swatch: '#00ff9f' },
  { id: 'vs-dark', name: 'VS Code Dark+', monacoBase: 'vs-dark', isDark: true, bg: '#1e1e1e', surface: '#252526', elevated: '#2d2d30', border: '#3c3c3c', text: '#d4d4d4', muted: '#858585', accent: '#007acc', success: '#4ec9b0', warning: '#dcdcaa', error: '#f44747', swatch: '#007acc' },
  { id: 'github-light', name: 'GitHub Light', monacoBase: 'vs', isDark: false, bg: '#ffffff', surface: '#f6f8fa', elevated: '#eaeef2', border: '#d0d7de', text: '#1f2328', muted: '#656d76', accent: '#0969da', success: '#1a7f37', warning: '#9a6700', error: '#cf222e', swatch: '#0969da' },
  { id: 'vs-light', name: 'VS Code Light+', monacoBase: 'vs', isDark: false, bg: '#ffffff', surface: '#f3f3f3', elevated: '#e8e8e8', border: '#d4d4d4', text: '#1e1e1e', muted: '#6b6b6b', accent: '#0066b8', success: '#2e9c33', warning: '#cc8800', error: '#d1241b', swatch: '#0066b8' },
  { id: 'solarized-light', name: 'Solarized Light', monacoBase: 'vs', isDark: false, bg: '#fdf6e3', surface: '#eee8d5', elevated: '#e4dcc4', border: '#d0c8b0', text: '#586e75', muted: '#93a1a1', accent: '#268bd2', success: '#859900', warning: '#b58900', error: '#dc322f', swatch: '#268bd2' },
];

export const FONTS = ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'Source Code Pro', 'Ubuntu Mono', 'Monaco', 'SF Mono', 'IBM Plex Mono', 'Victor Mono'];

export const ACCENT_COLORS = [
  { name: 'Blue', value: '#2f81f7' }, { name: 'Cyan', value: '#06b6d4' },
  { name: 'Green', value: '#3fb950' }, { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' }, { name: 'Purple', value: '#a371f7' },
  { name: 'Pink', value: '#ec4899' }, { name: 'Red', value: '#f85149' },
  { name: 'Orange', value: '#f97316' }, { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' }, { name: 'Gold', value: '#d4af37' },
];

export function getTheme(id: string): ThemeDef {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}
