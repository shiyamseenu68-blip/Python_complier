import Editor, { type OnMount } from '@monaco-editor/react';
import { useIDEStore } from '../../store/ideStore';
import { useEffect, useRef } from 'react';
import { getTheme } from '../../data/themes';

const LANG_MAP: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  html: 'html',
  css: 'css',
  json: 'json',
  plaintext: 'plaintext',
};

export function CodeEditor() {
  const { files, activeFileId, updateFileContent, settings } = useIDEStore();
  const file = files.find(f => f.id === activeFileId);
  const editorRef = useRef<any>(null);
  const themeRef = useRef<string>('');

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    const theme = getTheme(settings.theme);
    monaco.editor.defineTheme('python-studio', {
      base: theme.monacoBase as any,
      inherit: true,
      rules: [
        { token: 'comment', foreground: theme.muted, fontStyle: 'italic' },
        { token: 'keyword', foreground: theme.accent },
        { token: 'string', foreground: theme.success },
        { token: 'number', foreground: theme.warning },
        { token: 'type', foreground: theme.accent },
        { token: 'function', foreground: theme.accent },
        { token: 'variable', foreground: theme.text },
      ],
      colors: {
        'editor.background': theme.bg,
        'editor.foreground': theme.text,
        'editorLineNumber.foreground': theme.muted + '80',
        'editorLineNumber.activeForeground': theme.muted,
        'editor.selectionBackground': theme.accent + '40',
        'editor.lineHighlightBackground': theme.elevated,
        'editorCursor.foreground': theme.accent,
        'editorIndentGuide.background': theme.border + '60',
        'editorIndentGuide.activeBackground': theme.border,
        'editorWhitespace.foreground': theme.muted + '30',
        'editorBracketMatch.background': theme.accent + '30',
        'editorBracketMatch.border': theme.accent,
        'editorGutter.background': theme.bg,
        'editor.foldBackground': theme.elevated,
        'editorOverviewRuler.border': theme.border,
        'scrollbarSlider.background': theme.border + '80',
        'scrollbarSlider.hoverBackground': theme.border,
        'scrollbarSlider.activeBackground': theme.muted,
      },
    });
    monaco.editor.setTheme('python-studio');
    themeRef.current = settings.theme;
  };

  useEffect(() => {
    if (editorRef.current && themeRef.current !== settings.theme) {
      const monaco = (window as any).monaco;
      if (monaco) {
        const theme = getTheme(settings.theme);
        monaco.editor.defineTheme('python-studio', {
          base: theme.monacoBase as any,
          inherit: true,
          rules: [
            { token: 'comment', foreground: theme.muted, fontStyle: 'italic' },
            { token: 'keyword', foreground: theme.accent },
            { token: 'string', foreground: theme.success },
            { token: 'number', foreground: theme.warning },
            { token: 'function', foreground: theme.accent },
          ],
          colors: {
            'editor.background': theme.bg,
            'editor.foreground': theme.text,
            'editorLineNumber.foreground': theme.muted + '80',
            'editorLineNumber.activeForeground': theme.muted,
            'editor.selectionBackground': theme.accent + '40',
            'editor.lineHighlightBackground': theme.elevated,
            'editorCursor.foreground': theme.accent,
            'editorIndentGuide.background': theme.border + '60',
            'editorIndentGuide.activeBackground': theme.border,
          },
        });
        monaco.editor.setTheme('python-studio');
        themeRef.current = settings.theme;
      }
    }
  }, [settings.theme]);

  if (!file) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-3 text-4xl font-bold opacity-10">PY</div>
          <p className="text-sm text-cv-muted">Select a file to start coding</p>
        </div>
      </div>
    );
  }

  return (
    <Editor
      height="100%"
      language={LANG_MAP[file.language ?? 'plaintext'] ?? 'plaintext'}
      value={file.content}
      onChange={(val) => updateFileContent(file.id, val ?? '')}
      onMount={onMount}
      theme="python-studio"
      loading={<div className="flex h-full items-center justify-center text-sm text-cv-muted">Loading editor...</div>}
      options={{
        fontSize: settings.fontSize,
        fontFamily: `'${settings.font}', 'Fira Code', Consolas, monospace`,
        fontLigatures: settings.fontLigatures,
        fontWeight: settings.fontWeight as any,
        lineHeight: settings.lineHeight,
        letterSpacing: settings.letterSpacing,
        minimap: { enabled: settings.minimap, side: settings.minimapSide as any, maxColumn: 120 },
        lineNumbers: settings.lineNumbers ? 'on' : 'off',
        wordWrap: settings.wordWrap ? 'on' : 'off',
        tabSize: settings.tabSize,
        insertSpaces: settings.insertSpaces,
        smoothScrolling: settings.smoothScrolling,
        cursorBlinking: settings.cursorBlinking as any,
        cursorStyle: settings.cursorStyle as any,
        cursorSmoothCaretAnimation: settings.cursorSmoothCaretAnimation ? 'on' : 'off',
        cursorWidth: settings.cursorWidth,
        stickyScroll: { enabled: settings.stickyScroll },
        guides: { bracketPairs: settings.bracketColorization, indentation: settings.indentGuides },
        bracketPairColorization: { enabled: settings.bracketColorization },
        renderWhitespace: settings.renderWhitespace,
        renderLineHighlight: settings.renderLineHighlight as any,
        glyphMargin: settings.glyphMargin,
        folding: settings.folding,
        codeLens: settings.codeLens,
        parameterHints: { enabled: settings.parameterHints },
        quickSuggestions: settings.quickSuggestions,
        occurrencesHighlight: settings.occurrencesHighlight ? 'singleFile' : 'off',
        selectionHighlight: settings.selectionHighlight,
        mouseWheelZoom: settings.mouseWheelZoom,
        padding: { top: settings.padding, bottom: settings.padding },
        scrollbar: { verticalScrollbarSize: settings.scrollbarWidth, horizontalScrollbarSize: settings.scrollbarWidth, useShadows: false },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        roundedSelection: true,
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoIndent: 'advanced',
        formatOnPaste: false,
        formatOnType: true,
        linkedEditing: settings.linkedEditing,
        tabCompletion: 'on',
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
      }}
    />
  );
}
