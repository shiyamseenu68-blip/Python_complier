import { useIDEStore } from '../store/ideStore';
import { THEMES, FONTS, ACCENT_COLORS, getTheme } from '../data/themes';
import { X, Check, RotateCcw, Palette, Type, Code, Sliders } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CATS = [
  { id: 'appearance', label: 'Appearance', Icon: Palette },
  { id: 'editor', label: 'Editor', Icon: Code },
  { id: 'typography', label: 'Typography', Icon: Type },
  { id: 'features', label: 'Features', Icon: Sliders },
] as const;

export function SettingsPanel() {
  const { showSettings, setSettingsOpen, settings, updateSettings, notify } = useIDEStore();
  const [cat, setCat] = useState<typeof CATS[number]['id']>('appearance');

  if (!showSettings) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => setSettingsOpen(false)}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="flex h-[600px] max-h-[90vh] w-[760px] max-w-[95vw] overflow-hidden rounded-2xl border border-cv-border bg-cv-surface shadow-2xl"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-cv-border px-5 py-3 w-full absolute top-0 left-0 bg-cv-surface z-10" style={{ height: 48 }}>
            <h2 className="text-sm font-semibold text-cv-text">Settings</h2>
            <button onClick={() => setSettingsOpen(false)} className="cv-icon-btn"><X size={15} /></button>
          </div>
          <div className="flex flex-1 overflow-hidden" style={{ marginTop: 48 }}>
            <div className="w-40 shrink-0 border-r border-cv-border p-2 overflow-y-auto">
              {CATS.map(c => (
                <button key={c.id} onClick={() => setCat(c.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${cat === c.id ? 'bg-cv-accent/15 text-cv-text' : 'text-cv-muted hover:bg-white/5 hover:text-cv-text'}`}>
                  <c.Icon size={13} /> {c.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cat === 'appearance' && (
                <>
                  <Section label={`Themes (${THEMES.length})`}>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      {THEMES.map(t => (
                        <button key={t.id} onClick={() => updateSettings({ theme: t.id })}
                          className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs transition-all ${settings.theme === t.id ? 'border-cv-accent bg-cv-accent/10' : 'border-cv-border hover:border-cv-muted'}`}>
                          <div className="h-4 w-4 rounded-full border border-cv-border/50 shrink-0" style={{ background: t.bg }} />
                          <span className="truncate text-cv-text">{t.name}</span>
                          {settings.theme === t.id && <Check size={10} className="ml-auto text-cv-accent shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </Section>
                  <Section label="Accent Color">
                    <div className="flex flex-wrap gap-2">
                      {ACCENT_COLORS.map(c => (
                        <button key={c.value} onClick={() => updateSettings({ accentColor: c.value })}
                          className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${settings.accentColor === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ background: c.value }} title={c.name} />
                      ))}
                      <input type="color" value={settings.accentColor}
                        onChange={e => updateSettings({ accentColor: e.target.value })}
                        className="h-7 w-7 rounded-full border-2 border-cv-border cursor-pointer bg-transparent" title="Custom" />
                    </div>
                  </Section>
                </>
              )}

              {cat === 'editor' && (
                <>
                  <Range label={`Font Size: ${settings.fontSize}px`} min={8} max={36} value={settings.fontSize} onChange={v => updateSettings({ fontSize: v })} />
                  <Range label={`Editor Zoom: ${settings.editorZoom}%`} min={50} max={300} value={settings.editorZoom} onChange={v => updateSettings({ editorZoom: v })} />
                  <Range label={`Terminal Font Size: ${settings.terminalFontSize}px`} min={8} max={24} value={settings.terminalFontSize} onChange={v => updateSettings({ terminalFontSize: v })} />
                  <Range label={`Line Height: ${settings.lineHeight}px`} min={14} max={32} value={settings.lineHeight} onChange={v => updateSettings({ lineHeight: v })} />
                  <Range label={`Padding: ${settings.padding}px`} min={0} max={24} value={settings.padding} onChange={v => updateSettings({ padding: v })} />
                  <Select label="Tab Size" value={settings.tabSize} onChange={v => updateSettings({ tabSize: +v })} options={[{ value: 2, label: '2 spaces' }, { value: 4, label: '4 spaces' }, { value: 8, label: '8 spaces' }]} />
                  <Select label="Cursor Style" value={settings.cursorStyle} onChange={v => updateSettings({ cursorStyle: v })} options={['line', 'block', 'underline', 'line-thin'].map(o => ({ value: o, label: o }))} />
                  <Select label="Cursor Blinking" value={settings.cursorBlinking} onChange={v => updateSettings({ cursorBlinking: v })} options={['blink', 'smooth', 'phase', 'expand', 'solid'].map(o => ({ value: o, label: o }))} />
                  <Select label="Line Highlight" value={settings.renderLineHighlight} onChange={v => updateSettings({ renderLineHighlight: v as any })} options={['all', 'line', 'gutter', 'none'].map(o => ({ value: o, label: o }))} />
                </>
              )}

              {cat === 'typography' && (
                <>
                  <Section label="Font Family">
                    <select value={settings.font} onChange={e => updateSettings({ font: e.target.value })} className="cv-input w-full">
                      {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Section>
                  <Range label={`Letter Spacing: ${settings.letterSpacing}px`} min={-2} max={10} value={settings.letterSpacing} onChange={v => updateSettings({ letterSpacing: v })} />
                  <Select label="Font Weight" value={settings.fontWeight} onChange={v => updateSettings({ fontWeight: +v })} options={[{ value: 300, label: 'Light' }, { value: 400, label: 'Regular' }, { value: 500, label: 'Medium' }, { value: 600, label: 'Semibold' }, { value: 700, label: 'Bold' }]} />
                  <Toggle label="Font Ligatures" value={settings.fontLigatures} onChange={v => updateSettings({ fontLigatures: v })} />
                </>
              )}

              {cat === 'features' && (
                <>
                  <Toggle label="Word Wrap" value={settings.wordWrap} onChange={v => updateSettings({ wordWrap: v })} />
                  <Toggle label="Minimap" value={settings.minimap} onChange={v => updateSettings({ minimap: v })} />
                  <Toggle label="Line Numbers" value={settings.lineNumbers} onChange={v => updateSettings({ lineNumbers: v })} />
                  <Toggle label="Code Folding" value={settings.folding} onChange={v => updateSettings({ folding: v })} />
                  <Toggle label="Bracket Colorization" value={settings.bracketColorization} onChange={v => updateSettings({ bracketColorization: v })} />
                  <Toggle label="Indent Guides" value={settings.indentGuides} onChange={v => updateSettings({ indentGuides: v })} />
                  <Toggle label="Quick Suggestions" value={settings.quickSuggestions} onChange={v => updateSettings({ quickSuggestions: v })} />
                  <Toggle label="Auto Save" value={settings.autoSave} onChange={v => updateSettings({ autoSave: v })} />
                  <Toggle label="Smooth Scrolling" value={settings.smoothScrolling} onChange={v => updateSettings({ smoothScrolling: v })} />
                  <Toggle label="Mouse Wheel Zoom" value={settings.mouseWheelZoom} onChange={v => updateSettings({ mouseWheelZoom: v })} />
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-cv-border bg-cv-surface px-5 py-3 absolute bottom-0 left-0 w-full" style={{ height: 52 }}>
            <button onClick={() => { updateSettings({ theme: 'tokyo-night', fontSize: 14, fontLigatures: true, editorZoom: 100, minimap: true, lineNumbers: true }); notify({ type: 'success' as const, title: 'Reset to defaults' }); }}
              className="flex items-center gap-1.5 rounded-lg text-xs text-cv-error hover:bg-cv-error/10 px-3 py-1.5">
              <RotateCcw size={12} /> Reset
            </button>
            <button onClick={() => setSettingsOpen(false)} className="rounded-lg bg-cv-accent px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90">Done</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-2 block text-xs font-medium text-cv-muted">{label}</label>{children}</div>;
}

function Range({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-cv-muted">{label}</label>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(+e.target.value)} className="w-full accent-cv-accent" />
    </div>
  );
}

function Select<T extends string | number>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: string) => void; options: { value: T; label: string }[] }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-cv-muted">{label}</label>
      <select value={value as any} onChange={e => onChange(e.target.value)} className="cv-input w-full">
        {options.map(o => <option key={String(o.value)} value={o.value as any}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/5 text-xs transition-colors">
      <span className="text-cv-text">{label}</span>
      <div className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${value ? 'bg-cv-accent' : 'bg-cv-border'}`}>
        <div className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : ''}`} />
      </div>
    </button>
  );
}
