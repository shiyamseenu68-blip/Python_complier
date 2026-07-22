import { useIDEStore } from '../../store/ideStore';

export function StatusBar() {
  const { files, activeFileId, settings, getActiveFile, isRunning, outputEntries } = useIDEStore();
  const file = getActiveFile();
  const errors = outputEntries.filter(e => e.type === 'error' || e.type === 'stderr').length;
  const dirtyCount = files.filter(f => f.isDirty).length;

  return (
    <div className="flex items-center justify-between bg-cv-accent px-3 text-[11px] text-white" style={{ height: settings.statusBarHeight }}>
      <div className="flex items-center gap-3">
        {isRunning && <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Running</span>}
        {file && <span>{file.name}</span>}
        {file && <span className="opacity-80">{(file.language ?? 'plaintext').toUpperCase()}</span>}
      </div>
      <div className="flex items-center gap-3">
        {errors > 0 && <span className="opacity-90">{errors} error{errors !== 1 ? 's' : ''}</span>}
        {dirtyCount > 0 && <span className="opacity-80">{dirtyCount} unsaved</span>}
        <span className="opacity-80 hidden sm:inline">{settings.fontSize}px</span>
        <span className="opacity-80 hidden md:inline">UTF-8</span>
        <span className="opacity-80 hidden md:inline">LF</span>
        <span className="opacity-80 hidden lg:inline">Spaces: {settings.tabSize}</span>
      </div>
    </div>
  );
}
