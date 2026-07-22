export interface Theme { id:string;name:string;monacoBase:'vs-dark'|'vs';bg:string;surface:string;elevated:string;border:string;text:string;muted:string;accent:string;success:string;warning:string;error:string; }
export const THEMES:Theme[] = [
  {id:'tokyo-night',name:'Tokyo Night',   monacoBase:'vs-dark',bg:'#1a1b26',surface:'#16161e',elevated:'#1f2335',border:'#292e42',text:'#a9b1d6',muted:'#565f89',accent:'#7aa2f7',success:'#9ece6a',warning:'#e0af68',error:'#f7768e'},
  {id:'one-dark',   name:'One Dark Pro',  monacoBase:'vs-dark',bg:'#282c34',surface:'#21252b',elevated:'#2c313a',border:'#3b4048',text:'#abb2bf',muted:'#5c6370',accent:'#61afef',success:'#98c379',warning:'#e5c07b',error:'#e06c75'},
  {id:'catppuccin', name:'Catppuccin',    monacoBase:'vs-dark',bg:'#1e1e2e',surface:'#181825',elevated:'#313244',border:'#45475a',text:'#cdd6f4',muted:'#7f849c',accent:'#89b4fa',success:'#a6e3a1',warning:'#f9e2af',error:'#f38ba8'},
  {id:'nord',       name:'Nord',          monacoBase:'vs-dark',bg:'#2e3440',surface:'#272e3b',elevated:'#3b4252',border:'#434c5e',text:'#d8dee9',muted:'#616e88',accent:'#88c0d0',success:'#a3be8c',warning:'#ebcb8b',error:'#bf616a'},
  {id:'dracula',    name:'Dracula',       monacoBase:'vs-dark',bg:'#282a36',surface:'#21222c',elevated:'#343746',border:'#44475a',text:'#f8f8f2',muted:'#6272a4',accent:'#bd93f9',success:'#50fa7b',warning:'#f1fa8c',error:'#ff5555'},
  {id:'github-dark',name:'GitHub Dark',  monacoBase:'vs-dark',bg:'#0d1117',surface:'#161b22',elevated:'#21262d',border:'#30363d',text:'#e6edf3',muted:'#7d8590',accent:'#2f81f7',success:'#3fb950',warning:'#d29922',error:'#f85149'},
  {id:'vs-dark',    name:'VS Code Dark', monacoBase:'vs-dark',bg:'#1e1e1e',surface:'#252526',elevated:'#2d2d30',border:'#3c3c3c',text:'#d4d4d4',muted:'#858585',accent:'#007acc',success:'#4ec9b0',warning:'#dcdcaa',error:'#f44747'},
  {id:'github-light',name:'GitHub Light',monacoBase:'vs',     bg:'#ffffff',surface:'#f6f8fa',elevated:'#eaeef2',border:'#d0d7de',text:'#1f2328',muted:'#656d76',accent:'#0969da',success:'#1a7f37',warning:'#9a6700',error:'#cf222e'},
];
export const getTheme = (id:string):Theme => THEMES.find(t=>t.id===id)??THEMES[0];
export const FONTS = ['JetBrains Mono','Fira Code','Cascadia Code','Consolas','Source Code Pro','Ubuntu Mono'];
export const ACCENT_COLORS = [
  {name:'Blue',value:'#2f81f7'},{name:'Cyan',value:'#06b6d4'},{name:'Green',value:'#22c55e'},
  {name:'Teal',value:'#14b8a6'},{name:'Purple',value:'#a371f7'},{name:'Pink',value:'#ec4899'},
  {name:'Red',value:'#ef4444'},{name:'Orange',value:'#f97316'},{name:'Gold',value:'#d4af37'},
];
