import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FileNode, EditorTab, OutputEntry, OutputEntryType, NotificationItem, EditorSettings, PanelId, BottomTab, LanguageId } from '../types';

let idCounter = 0;
const uid = () => `id_${++idCounter}_${Date.now()}`;

export function detectLanguage(name: string): LanguageId {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, LanguageId> = {
    py: 'python', js: 'javascript', mjs: 'javascript',
    html: 'html', htm: 'html', css: 'css', json: 'json',
  };
  return map[ext] ?? 'plaintext';
}

const STARTER_CODE = `# Welcome to Python Studio
# A premium Python IDE that runs entirely in your browser

def greet(name):
    return f"Hello, {name}! Welcome to Python Studio."

print(greet("Developer"))
print()

# Try these features:
# 1. Run code with Ctrl+Enter or the Run button
# 2. Use input() to get user input
# 3. Switch themes in Settings
# 4. Open Command Palette with Ctrl+K

name = input("What's your name? ")
print(f"Nice to meet you, {name}!")

# Data structures
numbers = [1, 2, 3, 4, 5]
print(f"Sum: {sum(numbers)}")
print(f"Average: {sum(numbers) / len(numbers):.2f}")

# Dictionary
person = {"name": "Alice", "age": 30, "city": "NYC"}
for key, value in person.items():
    print(f"  {key}: {value}")
`;

const STARTER_FILES: FileNode[] = [
  { id: uid(), name: 'main.py', type: 'file', parentId: null, content: STARTER_CODE, language: 'python', isDirty: false },
];

const DEFAULT_SETTINGS: EditorSettings = {
  theme: 'tokyo-night',
  font: 'JetBrains Mono',
  fontSize: 14,
  fontWeight: 400,
  lineHeight: 21,
  letterSpacing: 0,
  fontLigatures: true,
  wordWrap: true,
  minimap: true,
  lineNumbers: true,
  tabSize: 4,
  insertSpaces: true,
  autoSave: true,
  autoSaveDelay: 1000,
  formatOnSave: false,
  bracketColorization: true,
  cursorBlinking: 'smooth',
  cursorStyle: 'line',
  cursorSmoothCaretAnimation: true,
  stickyScroll: true,
  indentGuides: true,
  folding: true,
  renderWhitespace: 'selection',
  smoothScrolling: true,
  mouseWheelZoom: false,
  codeLens: true,
  parameterHints: true,
  quickSuggestions: true,
  occurrencesHighlight: true,
  selectionHighlight: true,
  renderLineHighlight: 'all',
  glyphMargin: true,
  rulers: [],
  padding: 8,
  uiScale: 100,
  accentColor: '#7aa2f7',
  autoSaveInterval: 0,
  wordSpacing: 0,
  minimapSide: 'right',
  cursorWidth: 2,
  highlightActiveIndentGuide: true,
  editorZoom: 100,
  terminalZoom: 100,
  sidebarZoom: 100,
  editorBg: '',
  sidebarBg: '',
  terminalBg: '',
  tabBg: '',
  statusBarBg: '',
  borderColor: '',
  cursorColor: '',
  selectionColor: '',
  boldKeywords: true,
  italicComments: true,
  underlineErrors: true,
  rainbowBrackets: false,
  linkedEditing: true,
  colorDecorators: true,
  lightbulb: true,
  terminalFont: 'JetBrains Mono',
  terminalFontSize: 13,
  terminalTransparency: 95,
  tabHeight: 36,
  statusBarHeight: 24,
  minimapWidth: 100,
  scrollbarWidth: 10,
};

export interface IDEState {
  files: FileNode[];
  tabs: EditorTab[];
  activeTabId: string | null;
  activeFileId: string | null;
  activePanel: PanelId;
  bottomTab: BottomTab | null;
  bottomHeight: number;
  sidebarWidth: number;
  sidebarVisible: boolean;
  isRunning: boolean;
  abortRequested: boolean;
  outputEntries: OutputEntry[];
  notifications: NotificationItem[];
  settings: EditorSettings;
  showCommandPalette: boolean;
  showSettings: boolean;
  showExport: boolean;
  zenMode: boolean;
  mobileView: 'editor' | 'terminal';
  mobileSidebarOpen: boolean;
  inputPrompt: string | null;
  inputResolver: ((value: string | null) => void) | null;
  searchQuery: string;
  searchResults: { fileId: string; fileName: string; line: number; text: string; }[];

  setActiveFile: (id: string) => void;
  openFile: (fileId: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateFileContent: (id: string, content: string) => void;
  createFile: (name: string, parentId: string | null) => void;
  createFolder: (name: string, parentId: string | null) => void;
  deleteNode: (id: string) => void;
  renameNode: (id: string, name: string) => void;
  toggleFolder: (id: string) => void;
  setPanel: (p: PanelId) => void;
  setBottomTab: (t: BottomTab | null) => void;
  setBottomHeight: (h: number) => void;
  setSidebarWidth: (w: number) => void;
  toggleSidebar: () => void;
  addOutput: (type: OutputEntryType, message: string) => void;
  clearOutput: () => void;
  setRunning: (v: boolean) => void;
  requestAbort: () => void;
  notify: (n: Omit<NotificationItem, 'id'>) => void;
  dismissNotification: (id: string) => void;
  updateSettings: (patch: Partial<EditorSettings>) => void;
  setCommandPalette: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;
  setExportOpen: (v: boolean) => void;
  setZenMode: (v: boolean) => void;
  setMobileView: (v: 'editor' | 'terminal') => void;
  setMobileSidebar: (v: boolean) => void;
  requestInput: (prompt: string) => Promise<string | null>;
  submitInput: (value: string | null) => void;
  setSearchQuery: (q: string) => void;
  runSearch: () => void;
  saveFile: (id: string) => void;
  saveAll: () => void;
  downloadFile: (id: string) => void;
  uploadFiles: (files: File[]) => void;
  importFiles: (files: { name: string; content: string; language?: string }[]) => void;
  getActiveFile: () => FileNode | undefined;
  duplicateNode: (id: string) => void;
  toggleFavorite: (id: string) => void;
  moveNode: (id: string, newParentId: string | null) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setEditorZoom: (z: number) => void;
  setTerminalZoom: (z: number) => void;
  setSidebarZoom: (z: number) => void;
}

export const useIDEStore = create<IDEState>()(
  persist(
    (set, get) => ({
      files: STARTER_FILES,
      tabs: [],
      activeTabId: null,
      activeFileId: STARTER_FILES[0].id,
      activePanel: 'explorer',
      bottomTab: null,
      bottomHeight: 260,
      sidebarWidth: 240,
      sidebarVisible: true,
      isRunning: false,
      abortRequested: false,
      outputEntries: [],
      notifications: [],
      settings: DEFAULT_SETTINGS,
      showCommandPalette: false,
      showSettings: false,
      showExport: false,
      zenMode: false,
      mobileView: 'editor',
      mobileSidebarOpen: false,
      inputPrompt: null,
      inputResolver: null,
      searchQuery: '',
      searchResults: [],

      setActiveFile: (id) => {
        set({ activeFileId: id });
        get().openFile(id);
      },

      openFile: (fileId) => {
        const state = get();
        const file = state.files.find(f => f.id === fileId);
        if (!file || file.type !== 'file') return;
        const existing = state.tabs.find(t => t.fileId === fileId);
        if (existing) { set({ activeTabId: existing.id, activeFileId: fileId }); return; }
        const tab: EditorTab = { id: uid(), fileId, name: file.name, language: file.language ?? 'plaintext', isDirty: file.isDirty ?? false, isPinned: false };
        set(s => ({ tabs: [...s.tabs, tab], activeTabId: tab.id, activeFileId: fileId }));
      },

      closeTab: (tabId) => {
        const state = get();
        const idx = state.tabs.findIndex(t => t.id === tabId);
        if (idx === -1) return;
        const newTabs = state.tabs.filter(t => t.id !== tabId);
        let newActive = state.activeTabId;
        let newActiveFile = state.activeFileId;
        if (state.activeTabId === tabId) {
          const next = newTabs[idx] ?? newTabs[idx - 1] ?? null;
          newActive = next?.id ?? null;
          newActiveFile = next?.fileId ?? null;
        }
        set({ tabs: newTabs, activeTabId: newActive, activeFileId: newActiveFile });
      },

      setActiveTab: (tabId) => {
        const tab = get().tabs.find(t => t.id === tabId);
        set({ activeTabId: tabId, activeFileId: tab?.fileId ?? null });
      },

      updateFileContent: (id, content) =>
        set(s => ({
          files: s.files.map(f => f.id === id ? { ...f, content, isDirty: !s.settings.autoSave } : f),
          tabs: s.tabs.map(t => t.fileId === id ? { ...t, isDirty: !s.settings.autoSave } : t),
        })),

      createFile: (name, parentId) => {
        const id = uid();
        const lang = detectLanguage(name);
        const file: FileNode = { id, name, type: 'file', parentId, content: '', language: lang, isDirty: false };
        set(s => ({ files: [...s.files, file] }));
        get().openFile(id);
      },

      createFolder: (name, parentId) => {
        const id = uid();
        const folder: FileNode = { id, name, type: 'folder', parentId, isOpen: true };
        set(s => ({ files: [...s.files, folder] }));
      },

      deleteNode: (id) => {
        const state = get();
        const toDelete = new Set<string>([id]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const f of state.files) {
            if (f.parentId && toDelete.has(f.parentId) && !toDelete.has(f.id)) { toDelete.add(f.id); changed = true; }
          }
        }
        const newFiles = state.files.filter(f => !toDelete.has(f.id));
        const newTabs = state.tabs.filter(t => !toDelete.has(t.fileId));
        const newActive = newTabs.find(t => t.id === state.activeTabId)?.id ?? newTabs[newTabs.length - 1]?.id ?? null;
        set({ files: newFiles, tabs: newTabs, activeTabId: newActive, activeFileId: newTabs.find(t => t.id === newActive)?.fileId ?? null });
      },

      renameNode: (id, name) => {
        const lang = detectLanguage(name);
        set(s => ({
          files: s.files.map(f => f.id === id ? { ...f, name, language: f.type === 'file' ? lang : f.language } : f),
          tabs: s.tabs.map(t => t.fileId === id ? { ...t, name, language: lang } : t),
        }));
      },

      toggleFolder: (id) =>
        set(s => ({ files: s.files.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f) })),

      setPanel: (p) => set({ activePanel: p, mobileSidebarOpen: true }),
      setBottomTab: (t) => set({ bottomTab: t }),
      setBottomHeight: (h) => set({ bottomHeight: Math.max(100, Math.min(600, h)) }),
      setSidebarWidth: (w) => set({ sidebarWidth: Math.max(180, Math.min(420, w)) }),
      toggleSidebar: () => set(s => ({ sidebarVisible: !s.sidebarVisible })),

      addOutput: (type, message) =>
        set(s => ({ outputEntries: [...s.outputEntries.slice(-999), { id: uid(), type, message, timestamp: Date.now() }] })),
      clearOutput: () => set({ outputEntries: [] }),

      setRunning: (v) => set({ isRunning: v, abortRequested: false }),
      requestAbort: () => set({ abortRequested: true }),

      notify: (n) => {
        const id = uid();
        set(s => ({ notifications: [...s.notifications, { ...n, id }] }));
        setTimeout(() => get().dismissNotification(id), 4000);
      },
      dismissNotification: (id) =>
        set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),

      updateSettings: (patch) => set(s => ({ settings: { ...s.settings, ...patch } })),
      setCommandPalette: (v) => set({ showCommandPalette: v }),
      setSettingsOpen: (v) => set({ showSettings: v }),
      setExportOpen: (v) => set({ showExport: v }),
      setZenMode: (v) => set({ zenMode: v }),
      setMobileView: (v) => set({ mobileView: v }),
      setMobileSidebar: (v) => set({ mobileSidebarOpen: v }),

      requestInput: (prompt) => {
        return new Promise<string | null>((resolve) => {
          set({ inputPrompt: prompt, inputResolver: resolve });
        });
      },
      submitInput: (value) => {
        const resolver = get().inputResolver;
        if (resolver) resolver(value);
        set({ inputPrompt: null, inputResolver: null });
      },

      setSearchQuery: (q) => set({ searchQuery: q }),
      runSearch: () => {
        const state = get();
        const q = state.searchQuery.toLowerCase();
        if (!q) { set({ searchResults: [] }); return; }
        const results: IDEState['searchResults'] = [];
        for (const f of state.files) {
          if (f.type !== 'file' || !f.content) continue;
          const lines = f.content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(q)) {
              results.push({ fileId: f.id, fileName: f.name, line: i + 1, text: lines[i].trim().slice(0, 100) });
            }
          }
        }
        set({ searchResults: results });
      },

      saveFile: (id) =>
        set(s => ({
          files: s.files.map(f => f.id === id ? { ...f, isDirty: false } : f),
          tabs: s.tabs.map(t => t.fileId === id ? { ...t, isDirty: false } : t),
        })),
      saveAll: () =>
        set(s => ({
          files: s.files.map(f => ({ ...f, isDirty: false })),
          tabs: s.tabs.map(t => ({ ...t, isDirty: false })),
        })),

      downloadFile: (id) => {
        const file = get().files.find(f => f.id === id);
        if (!file || file.type !== 'file') return;
        const blob = new Blob([file.content ?? ''], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = file.name; a.click();
        URL.revokeObjectURL(url);
        get().notify({ type: 'success', title: `Downloaded ${file.name}` });
      },

      uploadFiles: (uploadedFiles) => {
        for (const file of uploadedFiles) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string ?? '';
            const lang = detectLanguage(file.name);
            const id = uid();
            const node: FileNode = { id, name: file.name, type: 'file', parentId: null, content, language: lang, isDirty: false };
            set(s => ({ files: [...s.files, node] }));
            get().openFile(id);
          };
          reader.readAsText(file);
        }
        get().notify({ type: 'success', title: `Uploaded ${uploadedFiles.length} file(s)` });
      },

      importFiles: (imported) => {
        for (const f of imported) {
          const lang = detectLanguage(f.name);
          const id = uid();
          const node: FileNode = { id, name: f.name, type: 'file', parentId: null, content: f.content, language: lang, isDirty: false };
          set(s => ({ files: [...s.files, node] }));
          get().openFile(id);
        }
        get().notify({ type: 'success', title: `Imported ${imported.length} file(s)` });
      },

      duplicateNode: (id) => {
        const file = get().files.find(f => f.id === id);
        if (!file || file.type !== 'file') return;
        const newId = uid();
        const copy: FileNode = { ...file, id: newId, name: file.name.replace(/(\.[^.]+)$/, '_copy$1'), isDirty: false };
        set(s => ({ files: [...s.files, copy] }));
        get().openFile(newId);
      },

      toggleFavorite: (id) =>
        set(s => ({ files: s.files.map(f => f.id === id ? { ...f, isFavorite: !f.isFavorite } : f) })),

      moveNode: (id, newParentId) =>
        set(s => ({ files: s.files.map(f => f.id === id ? { ...f, parentId: newParentId } : f) })),

      zoomIn: () => set(s => ({ settings: { ...s.settings, editorZoom: Math.min(300, s.settings.editorZoom + 10) } })),
      zoomOut: () => set(s => ({ settings: { ...s.settings, editorZoom: Math.max(50, s.settings.editorZoom - 10) } })),
      resetZoom: () => set(s => ({ settings: { ...s.settings, editorZoom: 100, terminalZoom: 100, sidebarZoom: 100, uiScale: 100 } })),
      setEditorZoom: (z) => set(s => ({ settings: { ...s.settings, editorZoom: Math.max(50, Math.min(300, z)) } })),
      setTerminalZoom: (z) => set(s => ({ settings: { ...s.settings, terminalZoom: Math.max(50, Math.min(300, z)) } })),
      setSidebarZoom: (z) => set(s => ({ settings: { ...s.settings, sidebarZoom: Math.max(50, Math.min(300, z)) } })),

      getActiveFile: () => get().files.find(f => f.id === get().activeFileId),
    }),
    {
      name: 'python-studio-settings',
      partialize: (state) => ({
        settings: state.settings,
        files: state.files,
        sidebarWidth: state.sidebarWidth,
        bottomHeight: state.bottomHeight,
      }),
    },
  ),
);
