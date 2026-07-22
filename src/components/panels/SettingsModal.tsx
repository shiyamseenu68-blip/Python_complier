import { useIDEStore } from '../../store/ideStore';
import { THEMES, FONTS, ACCENT_COLORS } from '../../data/themes';
import { X, Check, RotateCcw, Palette, Type, Code, Eye, Save, ZoomIn, Terminal, Columns, Sliders } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EditorSettings } from '../../types';

const CATEGORIES = [
  { id: 'appearance', name: 'Appearance', icon: Palette },
  { id: 'typography', name: 'Typography', icon: Type },
  { id: 'editor', name: 'Editor', icon: Code },
  { id: 'zoom', name: 'Zoom & Scale', icon: ZoomIn },
  { id: 'terminal', name: 'Terminal', icon: Terminal },
  { id: 'layout', name: 'Layout', icon: Columns },
  { id: 'features', name: 'Features', icon: Eye },
  { id: 'advanced', name: 'Advanced', icon: Sliders },
] as const;

const DEFAULTS: EditorSettings = {
  theme: 'tokyo-night', font: 'JetBrains Mono', fontSize: 14, fontWeight: 400,
  lineHeight: 21, letterSpacing: 0, wordSpacing: 0, fontLigatures: true, wordWrap: true,
  minimap: true, minimapSide: 'right', lineNumbers: true, tabSize: 4, insertSpaces: true,
  autoSave: true, autoSaveDelay: 1000, autoSaveInterval: 0, formatOnSave: false,
  bracketColorization: true, cursorBlinking: 'smooth', cursorStyle: 'line',
  cursorSmoothCaretAnimation: true, cursorWidth: 2, stickyScroll: true,
  indentGuides: true, highlightActiveIndentGuide: true, folding: true,
  renderWhitespace: 'selection', smoothScrolling: true, mouseWheelZoom: false,
  codeLens: true, parameterHints: true, quickSuggestions: true,
  occurrencesHighlight: true, selectionHighlight: true, renderLineHighlight: 'all',
  glyphMargin: true, rulers: [], padding: 8, uiScale: 100, accentColor: '#7aa2f7',
  editorZoom: 100, terminalZoom: 100, sidebarZoom: 100,
  editorBg: '', sidebarBg: '', terminalBg: '', tabBg: '', statusBarBg: '',
  borderColor: '', cursorColor: '', selectionColor: '',
  boldKeywords: true, italicComments: true, underlineErrors: true, rainbowBrackets: false,
  linkedEditing: true, colorDecorators: true, lightbulb: true,
  terminalFont: 'JetBrains Mono', terminalFontSize: 13, terminalTransparency: 95,
  tabHeight: 36, statusBarHeight: 24, minimapWidth: 100, scrollbarWidth: 10,
};

export function SettingsModal() {
  const { showSettings, setSettingsOpen, settings, updateSettings, notify } = useIDEStore();
  const [cat, setCat] = useState<typeof CATEGORIES[number]['id']>('appearance');

  if (!showSettings) return null;

  const reset = () => {
    updateSettings(DEFAULTS);
    notify({ type: 'success', title: 'Settings reset to defaults' });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => setSettingsOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          className="flex h-[640px] max-h-[90vh] w-[860px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-cv-border bg-cv-surface shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-cv-border px-5 py-3">
            <h2 className="text-sm font-semibold text-cv-text">Settings</h2>
            <button onClick={() => setSettingsOpen(false)} className="cv-icon-btn"><X size={16} /></button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-48 shrink-0 overflow-y-auto border-r border-cv-border p-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${cat === c.id ? 'bg-cv-accent/15 text-cv-text' : 'text-cv-muted hover:bg-cv-elevated hover:text-cv-text'}`}
                >
                  <c.icon size={14} /> {c.name}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cat === 'appearance' && (
                <>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-cv-muted">Color Theme ({THEMES.length} themes)</label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {THEMES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => updateSettings({ theme: t.id })}
                          className={`flex items-center gap-2 rounded-lg border p-2 text-xs transition-colors ${settings.theme === t.id ? 'border-cv-accent bg-cv-accent/10' : 'border-cv-border hover:border-cv-muted'}`}
                        >
                          <div className="h-5 w-5 rounded-full border border-cv-border" style={{ background: t.swatch }} />
                          <span className="truncate text-cv-text">{t.name}</span>
                          {settings.theme === t.id && <Check size={12} className="ml-auto text-cv-accent" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-cv-muted">Accent Color</label>
                    <div className="flex flex-wrap gap-2">
                      {ACCENT_COLORS.map(c => (
                        <button
                          key={c.value}
                          onClick={() => updateSettings({ accentColor: c.value })}
                          className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${settings.accentColor === c.value ? 'border-white' : 'border-transparent'}`}
                          style={{ background: c.value }}
                          title={c.name}
                        />
                      ))}
                      <input
                        type="color"
                        value={settings.accentColor}
                        onChange={e => updateSettings({ accentColor: e.target.value })}
                        className="h-8 w-8 rounded-full border-2 border-cv-border cursor-pointer bg-transparent"
                        title="Custom color"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-cv-muted">Custom Theme Colors</label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {[
                        { key: 'editorBg', label: 'Editor BG' },
                        { key: 'sidebarBg', label: 'Sidebar BG' },
                        { key: 'terminalBg', label: 'Terminal BG' },
                        { key: 'tabBg', label: 'Tab BG' },
                        { key: 'statusBarBg', label: 'Status Bar BG' },
                        { key: 'borderColor', label: 'Border' },
                        { key: 'cursorColor', label: 'Cursor' },
                        { key: 'selectionColor', label: 'Selection' },
                      ].map(c => (
                        <div key={c.key}>
                          <label className="mb-1 block text-[10px] text-cv-muted">{c.label}</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={(settings as any)[c.key] || '#000000'}
                              onChange={e => updateSettings({ [c.key]: e.target.value } as any)}
                              className="h-7 w-8 rounded border border-cv-border bg-transparent cursor-pointer"
                            />
                            <button
                              onClick={() => updateSettings({ [c.key]: '' } as any)}
                              className="cv-icon-btn !p-1"
                              title="Reset to theme default"
                            >
                              <RotateCcw size={10} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {cat === 'typography' && (
                <>
                  <Field label="Font Family">
                    <select value={settings.font} onChange={e => updateSettings({ font: e.target.value })} className="cv-input w-full">
                      {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Field>
                  <Field label={`Font Size: ${settings.fontSize}px`}>
                    <input type="range" min={8} max={72} value={settings.fontSize} onChange={e => updateSettings({ fontSize: +e.target.value })} className="w-full accent-cv-accent" />
                  </Field>
                  <Field label="Font Weight">
                    <select value={settings.fontWeight} onChange={e => updateSettings({ fontWeight: +e.target.value })} className="cv-input w-full">
                      <option value={300}>Light (300)</option>
                      <option value={400}>Regular (400)</option>
                      <option value={500}>Medium (500)</option>
                      <option value={600}>Semibold (600)</option>
                      <option value={700}>Bold (700)</option>
                    </select>
                  </Field>
                  <Field label={`Line Height: ${settings.lineHeight}px`}>
                    <input type="range" min={14} max={36} value={settings.lineHeight} onChange={e => updateSettings({ lineHeight: +e.target.value })} className="w-full accent-cv-accent" />
                  </Field>
                  <Field label={`Letter Spacing: ${settings.letterSpacing}px`}>
                    <input type="range" min={-2} max={10} value={settings.letterSpacing} onChange={e => updateSettings({ letterSpacing: +e.target.value })} className="w-full accent-cv-accent" />
                  </Field>
                  <Field label={`Word Spacing: ${settings.wordSpacing}px`}>
                    <input type="range" min={0} max={20} value={settings.wordSpacing} onChange={e => updateSettings({ wordSpacing: +e.target.value })} className="w-full accent-cv-accent" />
                  </Field>
                  <Field label={`Cursor Width: ${settings.cursorWidth}px`}>
                    <input type="range" min={1} max={10} value={settings.cursorWidth} onChange={e => updateSettings({ cursorWidth: +e.target.value })} className="w-full accent-cv-accent" />
                  </Field>
                  <div className="space-y-1 pt-2 border-t border-cv-border">
                    <Toggle label="Font Ligatures" value={settings.fontLigatures} onChange={v => updateSettings({ fontLigatures: v })} />
                    <Toggle label="Bold Keywords" value={settings.boldKeywords} onChange={v => updateSettings({ boldKeywords: v })} />
                    <Toggle label="Italic Comments" value={settings.italicComments} onChange={v => updateSettings({ italicComments: v })} />
                    <Toggle label="Underline Errors" value={settings.underlineErrors} onChange={v => updateSettings({ underlineErrors: v })} />
                    <Toggle label="Rainbow Brackets" value={settings.rainbowBrackets} onChange={v => updateSettings({ rainbowBrackets: v })} />
                  </div>
                </>
              )}

              {cat === 'editor' && (
                <>
                  <Field label="Tab Size">
                    <select value={settings.tabSize} onChange={e => updateSettings({ tabSize: +e.target.value })} className="cv-input w-full">
                      {[2, 4, 8].map(s => <option key={s} value={s}>{s} spaces</option>)}
                    </select>
                  </Field>
                  <Field label="Cursor Style">
                    <select value={settings.cursorStyle} onChange={e => updateSettings({ cursorStyle: e.target.value })} className="cv-input w-full">
                      {['line', 'block', 'underline', 'line-thin', 'block-outline', 'underline-thin'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Cursor Blinking">
                    <select value={settings.cursorBlinking} onChange={e => updateSettings({ cursorBlinking: e.target.value })} className="cv-input w-full">
                      {['blink', 'smooth', 'phase', 'expand', 'solid'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Render Whitespace">
                    <select value={settings.renderWhitespace} onChange={e => updateSettings({ renderWhitespace: e.target.value as any })} className="cv-input w-full">
                      {['none', 'boundary', 'selection', 'trailing', 'all'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Line Highlight">
                    <select value={settings.renderLineHighlight} onChange={e => updateSettings({ renderLineHighlight: e.target.value as any })} className="cv-input w-full">
                      {['all', 'line', 'gutter', 'none'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label={`Editor Padding: ${settings.padding}px`}>
                    <input type="range" min={0} max={32} value={settings.padding} onChange={e => updateSettings({ padding: +e.target.value })} className="w-full accent-cv-accent" />
                  </Field>
                  <div className="space-y-1 pt-2 border-t border-cv-border">
                    <Toggle label="Word Wrap" value={settings.wordWrap} onChange={v => updateSettings({ wordWrap: v })} />
                    <Toggle label="Line Numbers" value={settings.lineNumbers} onChange={v => updateSettings({ lineNumbers: v })} />
                    <Toggle label="Minimap" value={settings.minimap} onChange={v => updateSettings({ minimap: v })} />
                    <Toggle label="Indent Guides" value={settings.indentGuides} onChange={v => updateSettings({ indentGuides: v })} />
                    <Toggle label="Highlight Active Indent Guide" value={settings.highlightActiveIndentGuide} onChange={v => updateSettings({ highlightActiveIndentGuide: v })} />
                    <Toggle label="Code Folding" value={settings.folding} onChange={v => updateSettings({ folding: v })} />
                    <Toggle label="Sticky Scroll" value={settings.stickyScroll} onChange={v => updateSettings({ stickyScroll: v })} />
                    <Toggle label="Smooth Scrolling" value={settings.smoothScrolling} onChange={v => updateSettings({ smoothScrolling: v })} />
                    <Toggle label="Mouse Wheel Zoom" value={settings.mouseWheelZoom} onChange={v => updateSettings({ mouseWheelZoom: v })} />
                    <Toggle label="Bracket Pair Colorization" value={settings.bracketColorization} onChange={v => updateSettings({ bracketColorization: v })} />
                    <Toggle label="Smooth Cursor Animation" value={settings.cursorSmoothCaretAnimation} onChange={v => updateSettings({ cursorSmoothCaretAnimation: v })} />
                    <Toggle label="Linked Editing" value={settings.linkedEditing} onChange={v => updateSettings({ linkedEditing: v })} />
                    <Toggle label="Color Decorators" value={settings.colorDecorators} onChange={v => updateSettings({ colorDecorators: v })} />
                    <Toggle label="Lightbulb Suggestions" value={settings.lightbulb} onChange={v => updateSettings({ lightbulb: v })} />
                  </div>
                </>
              )}

              {cat === 'zoom' && (
                <>
                  <Field label={`UI Scale: ${settings.uiScale}%`}>
                    <input type="range" min={50} max={300} value={settings.uiScale} onChange={e => updateSettings({ uiScale: +e.target.value })} className="w-full accent-cv-accent" />
                  </Field>
                  <Field label={`Editor Zoom: ${settings.editorZoom}%`}>
                    <input type="range" min={50} max={300} value={settings.editorZoom} onChange={e => updateSettings({ editorZoom: +e.target.value })} className="w-full accent-cv-accent" />
                  </Field>
                  <Field label={`Terminal Zoom: ${settings.terminalZoom}%`}>
                    <input type="range" min={50} max={300} value={settings.terminalZoom} onChange={e => updateSettings({ terminalZoom: +e.target.value })} className="w-full accent-cv-accent" />
                  </Field>
                  <Field label={`Sidebar Zoom: ${settings.sidebarZoom}%`}>
                    <input type="range" min={50} max={300} value={settings.sidebarZoom} onChange={e => updateSettings({ sidebarZoom: +e.target.value })} className="w-full accent-cv-accent" />
                  </Field>
                  <button
                    onClick={() => updateSettings({ editorZoom: 100, terminalZoom: 100, sidebarZoom: 100, uiScale: 100 })}
                    className="flex items-center gap-1.5 rounded-lg border border-cv-border bg-cv-elevated px-3 py-1.5 text-xs text-cv-text hover:bg-cv-elevated/80"
                  >
                    <RotateCcw size={12} /> Reset All Zoom
                  </button>
                  <div className="space-y-1 pt-2 border-t border-cv-border">
                    <Toggle label="Mouse Wheel Zoom (Ctrl+Wheel)" value={settings.mouseWheelZoom} onChange={v => updateSettings({ mouseWheelZoom: v })} />
                  </div>
                </>
              )}

              {cat === 'terminal' && (
                <>
                  <Field label="Terminal Font">
                    <select value={settings.terminalFont} onChange={e => updateSettings({ terminalFont: e.target.value })} className="cv-input w-full">
                      {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Field>
                  <Field label={`Terminal Font Size: ${settings.terminalFontSize}px`}>
                    <input type="range" min={8} max={32} value={settings.terminalFontSize} onChange={e => updateSettings({ terminalFontSize: +e.target.value })} className="w-full accent-cv-accent" />
                  </Field>
                  <Field label={`Terminal Transparency: ${settings.terminalTransparency}%`}>
                    <input type="range" min={50} max={100} value={settings.terminalTransparency} onChange={e => updateSettings({ terminalTransparency: +e.target.value })} className="w-full accent-cv-accent" />
                  </Field>
                </>
              )}

              {cat === 'layout' && (
                <>
                  <Field label={`Tab Height: ${settings.tabHeight}px`}>
                    <input type="range" min={28} max={48} value={settings.tabHeight} onChange={e => updateSettings({ tabHeight: +e.target.value })} className="w-full accent-cv-accent" />
                  </Field>
                  <Field label={`Status Bar Height: ${settings.statusBarHeight}px`}>
                    <input type="range" min={20} max={36} value={settings.statusBarHeight} onChange={e => updateSettings({ statusBarHeight: +e.target.value })} className="w-full accent-cv-accent" />
                  </Field>
                  <Field label={`Minimap Width: ${settings.minimapWidth}px`}>
                    <input type="range" min={60} max={200} value={settings.minimapWidth} onChange={e => updateSettings({ minimapWidth: +e.target.value })} className="w-full accent-cv-accent" />
                  </Field>
                  <Field label={`Scrollbar Width: ${settings.scrollbarWidth}px`}>
                    <input type="range" min={6} max={20} value={settings.scrollbarWidth} onChange={e => updateSettings({ scrollbarWidth: +e.target.value })} className="w-full accent-cv-accent" />
                  </Field>
                  <Field label="Minimap Side">
                    <select value={settings.minimapSide} onChange={e => updateSettings({ minimapSide: e.target.value as any })} className="cv-input w-full">
                      <option value="right">Right</option>
                      <option value="left">Left</option>
                    </select>
                  </Field>
                </>
              )}

              {cat === 'features' && (
                <>
                  <Field label="Auto Save Delay">
                    <select value={settings.autoSaveDelay} onChange={e => updateSettings({ autoSaveDelay: +e.target.value })} className="cv-input w-full">
                      <option value={500}>500ms</option>
                      <option value={1000}>1s</option>
                      <option value={2000}>2s</option>
                      <option value={5000}>5s</option>
                    </select>
                  </Field>
                  <Field label="Auto Save Interval (Backup)">
                    <select value={settings.autoSaveInterval} onChange={e => updateSettings({ autoSaveInterval: +e.target.value as any })} className="cv-input w-full">
                      <option value={0}>Disabled</option>
                      <option value={5000}>Every 5s</option>
                      <option value={10000}>Every 10s</option>
                      <option value={30000}>Every 30s</option>
                      <option value={60000}>Every 1min</option>
                    </select>
                  </Field>
                  <div className="space-y-1 pt-2 border-t border-cv-border">
                    <Toggle label="Auto Save" value={settings.autoSave} onChange={v => updateSettings({ autoSave: v })} />
                    <Toggle label="Format on Save" value={settings.formatOnSave} onChange={v => updateSettings({ formatOnSave: v })} />
                    <Toggle label="Code Lens" value={settings.codeLens} onChange={v => updateSettings({ codeLens: v })} />
                    <Toggle label="Parameter Hints" value={settings.parameterHints} onChange={v => updateSettings({ parameterHints: v })} />
                    <Toggle label="Quick Suggestions" value={settings.quickSuggestions} onChange={v => updateSettings({ quickSuggestions: v })} />
                    <Toggle label="Occurrences Highlight" value={settings.occurrencesHighlight} onChange={v => updateSettings({ occurrencesHighlight: v })} />
                    <Toggle label="Selection Highlight" value={settings.selectionHighlight} onChange={v => updateSettings({ selectionHighlight: v })} />
                    <Toggle label="Glyph Margin" value={settings.glyphMargin} onChange={v => updateSettings({ glyphMargin: v })} />
                  </div>
                </>
              )}

              {cat === 'advanced' && (
                <>
                  <div className="rounded-lg border border-cv-border p-4">
                    <h3 className="mb-2 text-sm font-semibold text-cv-text">Storage & Recovery</h3>
                    <p className="text-xs text-cv-muted">Settings and files are persisted in localStorage. Backups and version history are stored in IndexedDB. Auto-recovery saves unsaved changes periodically.</p>
                  </div>
                  <div className="rounded-lg border border-cv-border p-4">
                    <h3 className="mb-2 text-sm font-semibold text-cv-text">Cloud Storage</h3>
                    <p className="text-xs text-cv-muted">Architecture is prepared for Google Drive, OneDrive, Dropbox, GitHub, and GitLab. These integrations will be available in a future update.</p>
                  </div>
                  <div className="rounded-lg border border-cv-border p-4">
                    <h3 className="mb-2 text-sm font-semibold text-cv-text">Performance</h3>
                    <p className="text-xs text-cv-muted">The editor uses Monaco Editor with virtualized rendering for large files. Lazy loading is enabled for the Python runtime (Pyodide).</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-cv-border px-5 py-3">
            <button onClick={reset} className="flex items-center gap-1.5 rounded-lg bg-cv-error/15 px-3 py-1.5 text-xs text-cv-error hover:bg-cv-error/25">
              <RotateCcw size={12} /> Reset to Defaults
            </button>
            <button onClick={() => setSettingsOpen(false)} className="flex items-center gap-1.5 rounded-lg bg-cv-accent px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90">
              <Save size={12} /> Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-cv-muted">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 hover:bg-cv-elevated/50 text-xs">
      <span className="text-cv-text">{label}</span>
      <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${value ? 'bg-cv-accent' : 'bg-cv-border'}`}>
        <span className={`h-4 w-4 rounded-full bg-white transition-transform ${value ? 'translate-x-4' : ''}`} />
      </span>
    </button>
  );
}
