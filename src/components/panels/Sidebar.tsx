import { useIDEStore } from '../../store/ideStore';
import {
  FileCode, FilePlus, FolderPlus, Trash2, ChevronRight, ChevronDown,
  Search, Settings as SettingsIcon, Files, FileText, Folder, Upload, Download,
} from 'lucide-react';
import { useState, useRef } from 'react';
import type { FileNode } from '../../types';

const LANG_COLORS: Record<string, string> = {
  python: 'text-green-400',
  javascript: 'text-yellow-400',
  html: 'text-orange-400',
  css: 'text-blue-400',
  json: 'text-amber-400',
  plaintext: 'text-gray-400',
};

export function Sidebar() {
  const {
    files, activeFileId, setActiveFile, createFile, createFolder,
    deleteNode, renameNode, toggleFolder, activePanel, setPanel,
    searchQuery, setSearchQuery, runSearch, searchResults, downloadFile, uploadFiles,
  } = useIDEStore();
  const [creating, setCreating] = useState<{ type: 'file' | 'folder'; parentId: string | null } | null>(null);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rootNodes = files.filter(f => f.parentId === null).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const childrenOf = (id: string) => files.filter(f => f.parentId === id).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const submitNew = () => {
    if (!creating || !newName.trim()) { setCreating(null); return; }
    if (creating.type === 'file') createFile(newName.trim(), creating.parentId);
    else createFolder(newName.trim(), creating.parentId);
    setNewName(''); setCreating(null);
  };

  const submitRename = () => {
    if (renaming && renameVal.trim()) renameNode(renaming, renameVal.trim());
    setRenaming(null); setRenameVal('');
  };

  const renderNode = (node: FileNode, depth: number): React.ReactNode => {
    if (node.type === 'folder') {
      const children = childrenOf(node.id);
      return (
        <div key={node.id}>
          <div
            className="group flex items-center gap-1 px-2 py-1 hover:bg-cv-elevated/50 cursor-pointer rounded text-sm"
            style={{ paddingLeft: depth * 12 + 8 }}
            onClick={() => toggleFolder(node.id)}
          >
            {node.isOpen ? <ChevronDown size={14} className="text-cv-muted" /> : <ChevronRight size={14} className="text-cv-muted" />}
            <Folder size={14} className="text-cv-accent" />
            {renaming === node.id ? (
              <input
                autoFocus
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onBlur={submitRename}
                onKeyDown={e => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setRenaming(null); }}
                className="cv-input flex-1 py-0"
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 truncate text-xs text-cv-text" onDoubleClick={() => { setRenaming(node.id); setRenameVal(node.name); }}>{node.name}</span>
            )}
            <div className="hidden group-hover:flex items-center gap-0.5">
              <button onClick={(e) => { e.stopPropagation(); setCreating({ type: 'file', parentId: node.id }); }} className="cv-icon-btn !p-0.5"><FilePlus size={11} /></button>
              <button onClick={(e) => { e.stopPropagation(); setCreating({ type: 'folder', parentId: node.id }); }} className="cv-icon-btn !p-0.5"><FolderPlus size={11} /></button>
              <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="cv-icon-btn !p-0.5 hover:text-cv-error"><Trash2 size={11} /></button>
            </div>
          </div>
          {node.isOpen && (
            <div>
              {creating?.parentId === node.id && (
                <div className="flex items-center gap-1 px-2 py-1" style={{ paddingLeft: (depth + 1) * 12 + 8 + 14 }}>
                  {creating.type === 'file' ? <FileText size={12} className="text-cv-muted" /> : <Folder size={12} className="text-cv-accent" />}
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onBlur={submitNew}
                    onKeyDown={e => { if (e.key === 'Enter') submitNew(); if (e.key === 'Escape') setCreating(null); }}
                    className="cv-input flex-1 py-0"
                    placeholder={creating.type === 'file' ? 'filename.py' : 'folder name'}
                  />
                </div>
              )}
              {children.map(c => renderNode(c, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    const active = activeFileId === node.id;
    return (
      <div key={node.id}>
        <div
          className={`group flex items-center gap-1 px-2 py-1 cursor-pointer rounded text-sm transition-colors ${active ? 'bg-cv-accent/15 text-cv-text' : 'hover:bg-cv-elevated/50 text-cv-muted'}`}
          style={{ paddingLeft: depth * 12 + 8 + 14 }}
          onClick={() => setActiveFile(node.id)}
        >
          {renaming === node.id ? (
            <input
              autoFocus
              value={renameVal}
              onChange={e => setRenameVal(e.target.value)}
              onBlur={submitRename}
              onKeyDown={e => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setRenaming(null); }}
              className="cv-input flex-1 py-0"
            />
          ) : (
            <>
              <FileCode size={13} className={LANG_COLORS[node.language ?? 'plaintext']} />
              <span className={`flex-1 truncate text-xs ${node.isDirty ? 'italic' : ''}`}>{node.name}{node.isDirty ? ' •' : ''}</span>
              <div className="hidden group-hover:flex items-center gap-0.5">
                <button onClick={(e) => { e.stopPropagation(); downloadFile(node.id); }} className="cv-icon-btn !p-0.5"><Download size={10} /></button>
                <button onClick={(e) => { e.stopPropagation(); setRenaming(node.id); setRenameVal(node.name); }} className="cv-icon-btn !p-0.5"><FileText size={10} /></button>
                <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="cv-icon-btn !p-0.5 hover:text-cv-error"><Trash2 size={10} /></button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-cv-surface">
      <div className="flex items-center gap-1 border-b border-cv-border px-2 py-1.5">
        <button
          onClick={() => setPanel('explorer')}
          className={`cv-icon-btn ${activePanel === 'explorer' ? 'text-cv-accent' : ''}`}
          title="Explorer"
        >
          <Files size={16} />
        </button>
        <button
          onClick={() => setPanel('search')}
          className={`cv-icon-btn ${activePanel === 'search' ? 'text-cv-accent' : ''}`}
          title="Search"
        >
          <Search size={16} />
        </button>
        <div className="flex-1" />
        <button onClick={() => fileInputRef.current?.click()} className="cv-icon-btn" title="Upload">
          <Upload size={14} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".py,.js,.html,.css,.json,.txt"
          className="hidden"
          onChange={(e) => { if (e.target.files) uploadFiles(Array.from(e.target.files)); e.target.value = ''; }}
        />
      </div>

      {activePanel === 'explorer' && (
        <>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-cv-muted">Explorer</span>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setCreating({ type: 'file', parentId: null })} className="cv-icon-btn" title="New File"><FilePlus size={13} /></button>
              <button onClick={() => setCreating({ type: 'folder', parentId: null })} className="cv-icon-btn" title="New Folder"><FolderPlus size={13} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pb-2">
            {creating?.parentId === null && (
              <div className="flex items-center gap-1 px-2 py-1" style={{ paddingLeft: 8 }}>
                {creating.type === 'file' ? <FileText size={12} className="text-cv-muted" /> : <Folder size={12} className="text-cv-accent" />}
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onBlur={submitNew}
                  onKeyDown={e => { if (e.key === 'Enter') submitNew(); if (e.key === 'Escape') setCreating(null); }}
                  className="cv-input flex-1 py-0"
                  placeholder={creating.type === 'file' ? 'filename.py' : 'folder name'}
                />
              </div>
            )}
            {rootNodes.length === 0 && !creating && (
              <div className="px-3 py-8 text-center text-xs text-cv-muted">
                <Files size={24} className="mx-auto mb-2 opacity-40" />
                <p>No files yet</p>
                <button onClick={() => setCreating({ type: 'file', parentId: null })} className="mt-2 text-cv-accent hover:underline">Create one</button>
              </div>
            )}
            {rootNodes.map(n => renderNode(n, 0))}
          </div>
        </>
      )}

      {activePanel === 'search' && (
        <>
          <div className="px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-cv-muted">Search</span>
          </div>
          <div className="px-2 pb-2">
            <input
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setTimeout(() => runSearch(), 100); }}
              onKeyDown={e => { if (e.key === 'Enter') runSearch(); }}
              placeholder="Search in files..."
              className="cv-input w-full"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {searchResults.length === 0 && searchQuery && (
              <div className="px-3 py-4 text-center text-xs text-cv-muted">No results</div>
            )}
            {searchResults.map((r, i) => (
              <div
                key={i}
                onClick={() => setActiveFile(r.fileId)}
                className="px-3 py-1.5 hover:bg-cv-elevated/50 cursor-pointer"
              >
                <div className="text-xs text-cv-text">{r.fileName}:{r.line}</div>
                <div className="text-[10px] text-cv-muted truncate">{r.text}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
