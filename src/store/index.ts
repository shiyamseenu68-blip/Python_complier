import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FileNode, EditorTab, OutputEntry, OutputEntryType, NotificationItem, EditorSettings, LanguageId, PanelId, BottomTab } from '../types';

let _seq = 0;
const uid = () => `id${++_seq}_${Date.now()}`;

function detectLang(name: string): FileNode['language'] {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const m: Record<string, FileNode['language']> = {
    py: 'python', js: 'javascript', html: 'html', htm: 'html',
    css: 'css', json: 'json',
  };
  return m[ext] ?? 'plaintext';
}

const WELCOME = `print("This compiler was created by Shiyam")

# ─── Welcome to Python Studio ──────────────────────────────────────
# Run code with Ctrl+Enter  |  Open settings with the ⚙ button
# ────────────────────────────────────────────────────────────────────

name = input("What is your name? ")
print(f"Hello, {name}! Welcome to Python Studio.")

# ── Built-in types ──────────────────────────────────────────────────
numbers = [1, 2, 3, 4, 5]
print("Sum:", sum(numbers))

person = {"name": name, "language": "Python"}
for k, v in person.items():
    print(f"  {k}: {v}")

# ── Functions ───────────────────────────────────────────────────────
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

n = int(input("Enter a number for factorial: "))
print(f"{n}! = {factorial(n)}")

# ── Classes ─────────────────────────────────────────────────────────
class Animal:
    def __init__(self, name, sound):
        self.name = name
        self.sound = sound
    def speak(self):
        return f"{self.name} says {self.sound}"

class Dog(Animal):
    def __init__(self, name):
        super().__init__(name, "Woof")

dog = Dog("Buddy")
print(dog.speak())

# ── Exception handling ──────────────────────────────────────────────
try:
    result = 10 / 0
except ZeroDivisionError as e:
    print(f"Caught error: {e}")
`;

const makeWelcomeFile = (): FileNode => ({
  id: uid(),
  name: 'main.py',
  type: 'file',
  parentId: null,
  content: WELCOME,
  language: 'python',
  isDirty: false,
});

const DEFAULT_SETTINGS: EditorSettings = {
  theme: 'tokyo-night',
  font: 'JetBrains Mono',
  fontSize: 14,
  fontWeight: 400,
  lineHeight: 22,
  letterSpacing: 0,
  wordSpacing: 0,
  fontLigatures: true,
  wordWrap: true,
  minimap: true,
  lineNumbers: true,
  tabSize: 4,
  insertSpaces: true,
  autoSave: true,
  autoSaveDelay: 1000,
  autoSaveInterval: 0,
  formatOnSave: false,
  bracketColorization: true,
  cursorBlinking: 'smooth',
  cursorStyle: 'line',
  cursorSmoothCaretAnimation: true,
  cursorWidth: 2,
  stickyScroll: false,
  indentGuides: true,
  highlightActiveIndentGuide: true,
  folding: true,
  renderWhitespace: 'selection' as const,
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
  minimapSide: 'right',
};

export interface IDEStore {
  files: FileNode[];
  tabs: EditorTab[];
  activeTabId: string | null;
  activeFileId: string | null;
  activePanel: PanelId;
  bottomTab: BottomTab | null;
  sidebarVisible: boolean;
  sidebarWidth: number;
  bottomVisible: boolean;
  bottomHeight: number;
  isRunning: boolean;
  abortFlag: { aborted: boolean };
  output: OutputEntry[];
  notifications: NotificationItem[];
  settings: EditorSettings;
  showSettings: boolean;
  showExport: boolean;
  showCommandPalette: boolean;
  zenMode: boolean;
  mobileView: 'editor' | 'terminal';
  mobileSidebarOpen: boolean;
  inputPrompt: string | null;
  inputResolve: ((v: string) => void) | null;
  searchQuery: string;
  searchResults: { fileId: string; fileName: string; line: number; text: string }[];

  // File ops
  openFile: (id: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  createFile: (name: string, parentId?: string | null) => void;
  createFolder: (name: string, parentId?: string | null) => void;
  deleteNode: (id: string) => void;
  renameNode: (id: string, name: string) => void;
  toggleFolder: (id: string) => void;
  saveFile: (id: string) => void;
  saveAll: () => void;
  uploadFiles: (files: File[]) => void;
  importFiles: (entries: { name: string; content: string }[]) => void;
  downloadFile: (id: string) => void;
  getActiveFile: () => FileNode | undefined;

  // UI
  toggleSidebar: () => void;
  setSidebarWidth: (w: number) => void;
  setBottomVisible: (v: boolean) => void;
  setBottomHeight: (h: number) => void;
  setPanel: (p: PanelId) => void;
  setBottomTab: (t: BottomTab | null) => void;
  setSettingsOpen: (v: boolean) => void;
  setExportOpen: (v: boolean) => void;
  setCommandPalette: (v: boolean) => void;
  setZenMode: (v: boolean) => void;
  setMobileView: (v: 'editor' | 'terminal') => void;
  setMobileSidebar: (v: boolean) => void;
  setSearchQuery: (q: string) => void;
  runSearch: () => void;

  // Execution
  setRunning: (v: boolean) => void;
  addOutput: (type: OutputEntryType, msg: string) => void;
  clearOutput: () => void;
  requestAbort: () => void;
  requestInput: (prompt: string) => Promise<string>;
  resolveInput: (v: string) => void;

  // Settings
  updateSettings: (patch: Partial<EditorSettings>) => void;

  // Notifications
  notify: (n: Omit<NotificationItem, 'id'>) => void;
  dismissNotification: (id: string) => void;

  // Zoom
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

const initialFile = makeWelcomeFile();

export const useStore = create<IDEStore>()(
  persist(
    (set, get) => ({
      files: [initialFile],
      tabs: [],
      activeTabId: null,
      activeFileId: initialFile.id,
      activePanel: 'explorer',
      bottomTab: null,
      sidebarVisible: true,
      sidebarWidth: 240,
      bottomVisible: false,
      bottomHeight: 260,
      isRunning: false,
      abortFlag: { aborted: false },
      output: [],
      notifications: [],
      settings: DEFAULT_SETTINGS,
      showSettings: false,
      showExport: false,
      showCommandPalette: false,
      zenMode: false,
      mobileView: 'editor',
      mobileSidebarOpen: false,
      inputPrompt: null,
      inputResolve: null,
      searchQuery: '',
      searchResults: [],

      openFile: (id) => {
        const file = get().files.find(f => f.id === id);
        if (!file || file.type !== 'file') return;
        const existing = get().tabs.find(t => t.fileId === id);
        if (existing) {
          set({ activeTabId: existing.id, activeFileId: id });
          return;
        }
        const tab: EditorTab = { id: uid(), fileId: id, name: file.name, language: (file.language ?? 'plaintext') as LanguageId, isDirty: false };
        set(s => ({ tabs: [...s.tabs, tab], activeTabId: tab.id, activeFileId: id }));
      },

      closeTab: (tabId) => {
        const s = get();
        const idx = s.tabs.findIndex(t => t.id === tabId);
        if (idx === -1) return;
        const newTabs = s.tabs.filter(t => t.id !== tabId);
        let newActive = s.activeTabId === tabId ? (newTabs[idx] ?? newTabs[idx - 1] ?? null) : s.tabs.find(t => t.id === s.activeTabId) ?? null;
        set({ tabs: newTabs, activeTabId: newActive?.id ?? null, activeFileId: newActive?.fileId ?? null });
      },

      setActiveTab: (id) => {
        const tab = get().tabs.find(t => t.id === id);
        set({ activeTabId: id, activeFileId: tab?.fileId ?? null });
      },

      updateContent: (id, content) => {
        set(s => ({
          files: s.files.map(f => f.id === id ? { ...f, content, isDirty: !s.settings.autoSave } : f),
          tabs: s.tabs.map(t => t.fileId === id ? { ...t, isDirty: !s.settings.autoSave } : t),
        }));
      },

      createFile: (name, parentId = null) => {
        const id = uid();
        const file: FileNode = { id, name, type: 'file', parentId, content: '', language: detectLang(name), isDirty: false };
        set(s => ({ files: [...s.files, file] }));
        get().openFile(id);
      },

      createFolder: (name, parentId = null) => {
        const id = uid();
        set(s => ({ files: [...s.files, { id, name, type: 'folder', parentId, isOpen: true }] }));
      },

      deleteNode: (id) => {
        const allIds = new Set<string>([id]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const f of get().files) {
            if (f.parentId && allIds.has(f.parentId) && !allIds.has(f.id)) { allIds.add(f.id); changed = true; }
          }
        }
        const newFiles = get().files.filter(f => !allIds.has(f.id));
        const newTabs = get().tabs.filter(t => !allIds.has(t.fileId));
        const active = newTabs.find(t => t.id === get().activeTabId) ?? newTabs[newTabs.length - 1] ?? null;
        set({ files: newFiles, tabs: newTabs, activeTabId: active?.id ?? null, activeFileId: active?.fileId ?? null });
      },

      renameNode: (id, name) => {
        const lang = detectLang(name);
        set(s => ({
          files: s.files.map(f => f.id === id ? { ...f, name, ...(f.type === 'file' ? { language: lang as LanguageId } : {}) } : f),
          tabs: s.tabs.map(t => t.fileId === id ? { ...t, name, language: lang as LanguageId } : t),
        }));
      },

      toggleFolder: (id) => set(s => ({ files: s.files.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f) })),

      saveFile: (id) => set(s => ({
        files: s.files.map(f => f.id === id ? { ...f, isDirty: false } : f),
        tabs: s.tabs.map(t => t.fileId === id ? { ...t, isDirty: false } : t),
      })),

      saveAll: () => set(s => ({
        files: s.files.map(f => ({ ...f, isDirty: false })),
        tabs: s.tabs.map(t => ({ ...t, isDirty: false })),
      })),

      uploadFiles: (uploaded) => {
        for (const file of uploaded) {
          const reader = new FileReader();
          reader.onload = e => {
            const content = (e.target?.result as string) ?? '';
            const id = uid();
            const node: FileNode = { id, name: file.name, type: 'file', parentId: null, content, language: detectLang(file.name), isDirty: false };
            set(s => ({ files: [...s.files, node] }));
            get().openFile(id);
          };
          reader.readAsText(file);
        }
        get().notify({ type: 'success', title: `Uploaded ${uploaded.length} file(s)` });
      },

      importFiles: (entries) => {
        for (const e of entries) {
          const id = uid();
          const node: FileNode = { id, name: e.name, type: 'file', parentId: null, content: e.content, language: detectLang(e.name), isDirty: false };
          set(s => ({ files: [...s.files, node] }));
          get().openFile(id);
        }
        get().notify({ type: 'success', title: `Imported ${entries.length} file(s)` });
      },

      downloadFile: (id) => {
        const file = get().files.find(f => f.id === id);
        if (!file) return;
        const blob = new Blob([file.content ?? ''], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = file.name; a.click();
        URL.revokeObjectURL(url);
        get().notify({ type: 'success', title: `Downloaded ${file.name}` });
      },

      getActiveFile: () => get().files.find(f => f.id === get().activeFileId),

      toggleSidebar: () => set(s => ({ sidebarVisible: !s.sidebarVisible })),
      setSidebarWidth: (w) => set({ sidebarWidth: Math.max(160, Math.min(480, w)) }),
      setBottomVisible: (v) => set({ bottomVisible: v }),
      setBottomHeight: (h) => set({ bottomHeight: Math.max(80, Math.min(600, h)) }),
      setPanel: (p) => set({ activePanel: p }),
      setBottomTab: (t) => set({ bottomTab: t }),
      setSettingsOpen: (v) => set({ showSettings: v }),
      setExportOpen: (v) => set({ showExport: v }),
      setCommandPalette: (v) => set({ showCommandPalette: v }),
      setZenMode: (v) => set({ zenMode: v }),
      setMobileView: (v) => set({ mobileView: v }),
      setMobileSidebar: (v) => set({ mobileSidebarOpen: v }),
      setSearchQuery: (q) => set({ searchQuery: q }),

      runSearch: () => {
        const { files, searchQuery } = get();
        const q = searchQuery.toLowerCase();
        if (!q) { set({ searchResults: [] }); return; }
        const results: IDEStore['searchResults'] = [];
        for (const f of files) {
          if (f.type !== 'file' || !f.content) continue;
          f.content.split('\n').forEach((line, i) => {
            if (line.toLowerCase().includes(q)) {
              results.push({ fileId: f.id, fileName: f.name, line: i + 1, text: line.trim().slice(0, 120) });
            }
          });
        }
        set({ searchResults: results });
      },

      setRunning: (v) => {
        if (v) set({ isRunning: true, abortFlag: { aborted: false } });
        else set({ isRunning: false });
      },

      addOutput: (type, msg) => set(s => ({
        output: [...s.output.slice(-2000), { id: uid(), type, message: msg, timestamp: Date.now() }],
      })),

      clearOutput: () => set({ output: [] }),

      requestAbort: () => {
        get().abortFlag.aborted = true;
        set({ isRunning: false });
        if (get().inputResolve) get().resolveInput('');
      },

      requestInput: (prompt) => new Promise<string>(resolve => {
        set({ inputPrompt: prompt, inputResolve: resolve });
      }),

      resolveInput: (v) => {
        const resolve = get().inputResolve;
        if (resolve) resolve(v);
        set({ inputPrompt: null, inputResolve: null });
      },

      updateSettings: (patch) => set(s => ({ settings: { ...s.settings, ...patch } })),

      notify: (n) => {
        const id = uid();
        set(s => ({ notifications: [...s.notifications, { ...n, id }] }));
        setTimeout(() => get().dismissNotification(id), 4500);
      },
      dismissNotification: (id) => set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),

      zoomIn: () => set(s => ({ settings: { ...s.settings, editorZoom: Math.min(300, s.settings.editorZoom + 10) } })),
      zoomOut: () => set(s => ({ settings: { ...s.settings, editorZoom: Math.max(50, s.settings.editorZoom - 10) } })),
      resetZoom: () => set(s => ({ settings: { ...s.settings, editorZoom: 100 } })),
    }),
    {
      name: 'python-studio-v2',
      partialize: s => ({
        settings: s.settings,
        files: s.files,
        sidebarWidth: s.sidebarWidth,
        bottomHeight: s.bottomHeight,
      }),
    },
  ),
);
