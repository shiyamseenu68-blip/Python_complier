export type LanguageId = 'python' | 'javascript' | 'html' | 'css' | 'json' | 'plaintext';

export type OutputEntryType = 'stdout' | 'stderr' | 'info' | 'error' | 'system' | 'input';

export type PanelId = 'explorer' | 'search' | 'git';

export type BottomTab = 'terminal' | 'output' | 'problems' | null;

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  content?: string;
  language?: LanguageId;
  isOpen?: boolean;
  isDirty?: boolean;
  isFavorite?: boolean;
}

export interface EditorTab {
  id: string;
  fileId: string;
  name: string;
  language: LanguageId;
  isDirty: boolean;
  isPinned?: boolean;
}

export interface OutputEntry {
  id: string;
  type: OutputEntryType;
  message: string;
  timestamp: number;
}

export interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export interface EditorSettings {
  theme: string;
  font: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  fontLigatures: boolean;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  tabSize: number;
  insertSpaces: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  autoSaveInterval: number;
  formatOnSave: boolean;
  bracketColorization: boolean;
  cursorBlinking: string;
  cursorStyle: string;
  cursorSmoothCaretAnimation: boolean;
  cursorWidth: number;
  stickyScroll: boolean;
  indentGuides: boolean;
  highlightActiveIndentGuide: boolean;
  folding: boolean;
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
  smoothScrolling: boolean;
  mouseWheelZoom: boolean;
  codeLens: boolean;
  parameterHints: boolean;
  quickSuggestions: boolean;
  occurrencesHighlight: boolean;
  selectionHighlight: boolean;
  renderLineHighlight: 'all' | 'line' | 'none' | 'gutter';
  glyphMargin: boolean;
  rulers: number[];
  padding: number;
  uiScale: number;
  accentColor: string;
  editorZoom: number;
  terminalZoom: number;
  sidebarZoom: number;
  editorBg: string;
  sidebarBg: string;
  terminalBg: string;
  tabBg: string;
  statusBarBg: string;
  borderColor: string;
  cursorColor: string;
  selectionColor: string;
  boldKeywords: boolean;
  italicComments: boolean;
  underlineErrors: boolean;
  rainbowBrackets: boolean;
  linkedEditing: boolean;
  colorDecorators: boolean;
  lightbulb: boolean;
  terminalFont: string;
  terminalFontSize: number;
  terminalTransparency: number;
  tabHeight: number;
  statusBarHeight: number;
  minimapWidth: number;
  scrollbarWidth: number;
  minimapSide: 'left' | 'right';
}

export interface CommandItem {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action: () => void;
}
