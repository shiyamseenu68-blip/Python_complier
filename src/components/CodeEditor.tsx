import Editor, { type OnMount } from '@monaco-editor/react';
import { useStore } from '../store';
import { getTheme } from '../themes';

export function CodeEditor() {
  const { files, activeFileId, updateContent, cfg } = useStore();
  const file  = files.find(f => f.id === activeFileId);
  const theme = getTheme(cfg.theme);

  const onMount: OnMount = (_ed, monaco) => {
    monaco.editor.defineTheme('studio', {
      base: theme.monacoBase, inherit: true,
      rules: [
        { token: 'comment', foreground: theme.muted.slice(1), fontStyle: 'italic' },
        { token: 'keyword', foreground: theme.accent.slice(1), fontStyle: 'bold'  },
        { token: 'string',  foreground: theme.success.slice(1) },
        { token: 'number',  foreground: theme.warning.slice(1) },
      ],
      colors: {
        'editor.background':                theme.bg,
        'editor.foreground':                theme.text,
        'editorLineNumber.foreground':      theme.muted + '88',
        'editorLineNumber.activeForeground':theme.muted,
        'editor.selectionBackground':       theme.accent + '44',
        'editor.lineHighlightBackground':   theme.elevated + 'bb',
        'editorCursor.foreground':          cfg.accent || theme.accent,
        'editorGutter.background':          theme.bg,
        'scrollbarSlider.background':       theme.border + '88',
        'editorWidget.background':          theme.surface,
        'editorSuggestWidget.background':   theme.surface,
        'editorSuggestWidget.border':       theme.border,
        'focusBorder':                      theme.accent,
      },
    });
    monaco.editor.setTheme('studio');
  };

  if (!file) return (
    <div className="flex h-full items-center justify-center" style={{ background: theme.bg }}>
      <div className="text-center opacity-20" style={{ color: theme.muted }}>
        <div className="mb-2 text-5xl font-black" style={{ color: theme.accent }}>PY</div>
        <p className="text-sm">Open a .py file to start coding</p>
      </div>
    </div>
  );

  const fs = Math.round(cfg.fontSize * cfg.zoom / 100);
  return (
    <Editor
      height="100%"
      language={file.language === 'python' ? 'python' : file.language ?? 'plaintext'}
      value={file.content}
      onChange={v => updateContent(file.id, v ?? '')}
      onMount={onMount}
      theme="studio"
      loading={
        <div className="flex h-full items-center justify-center text-sm"
          style={{ background: theme.bg, color: theme.muted }}>
          Loading editor…
        </div>
      }
      options={{
        fontSize: fs,
        fontFamily: `'${cfg.font}','JetBrains Mono',Consolas,monospace`,
        fontLigatures: cfg.fontLigatures,
        lineHeight: cfg.lineHeight,
        minimap: { enabled: cfg.minimap },
        lineNumbers: cfg.lineNumbers ? 'on' : 'off',
        wordWrap: cfg.wordWrap ? 'on' : 'off',
        tabSize: cfg.tabSize, insertSpaces: true,
        smoothScrolling: cfg.smoothScroll,
        cursorBlinking: cfg.cursorBlink as any,
        cursorStyle: cfg.cursorStyle as any,
        cursorSmoothCaretAnimation: 'on',
        guides: { bracketPairs: cfg.bracketPairs, indentation: true },
        bracketPairColorization: { enabled: cfg.bracketPairs },
        renderLineHighlight: 'all',
        folding: cfg.folding,
        quickSuggestions: cfg.quickSuggest,
        padding: { top: 8, bottom: 8 },
        scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6, useShadows: false },
        automaticLayout: true, scrollBeyondLastLine: false,
        autoClosingBrackets: 'always', autoClosingQuotes: 'always',
        tabCompletion: 'on', parameterHints: { enabled: true },
        overviewRulerLanes: 0,
      }}
    />
  );
}
