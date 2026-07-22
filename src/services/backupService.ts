import type { FileNode } from '../types';

const DB_NAME = 'python-studio-backup';
const DB_VERSION = 1;
const STORE_VERSIONS = 'versions';
const STORE_SNAPSHOTS = 'snapshots';
const STORE_RECOVERY = 'recovery';

export interface VersionEntry {
  id: string;
  fileId: string;
  fileName: string;
  content: string;
  timestamp: number;
  label?: string;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDB(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_VERSIONS)) db.createObjectStore(STORE_VERSIONS, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(STORE_RECOVERY)) db.createObjectStore(STORE_RECOVERY, { keyPath: 'fileId' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
  return dbPromise;
}

async function dbPut(store: string, value: any): Promise<void> {
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch { resolve(); }
  });
}

async function dbGetAll<T>(store: string): Promise<T[]> {
  const db = await openDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => resolve([]);
    } catch { resolve([]); }
  });
}

async function dbDelete(store: string, id: string): Promise<void> {
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch { resolve(); }
  });
}

async function dbClear(store: string): Promise<void> {
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch { resolve(); }
  });
}

// Version History
export async function saveVersion(file: FileNode, label?: string): Promise<VersionEntry> {
  const entry: VersionEntry = {
    id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    fileId: file.id,
    fileName: file.name,
    content: file.content ?? '',
    timestamp: Date.now(),
    label,
  };
  await dbPut(STORE_VERSIONS, entry);
  return entry;
}

export async function getVersions(fileId: string): Promise<VersionEntry[]> {
  const all = await dbGetAll<VersionEntry>(STORE_VERSIONS);
  return all.filter(v => v.fileId === fileId).sort((a, b) => b.timestamp - a.timestamp);
}

export async function restoreVersion(versionId: string): Promise<VersionEntry | null> {
  const all = await dbGetAll<VersionEntry>(STORE_VERSIONS);
  return all.find(v => v.id === versionId) ?? null;
}

export async function deleteVersion(versionId: string): Promise<void> {
  await dbDelete(STORE_VERSIONS, versionId);
}

export async function clearVersions(): Promise<void> {
  await dbClear(STORE_VERSIONS);
}

// Snapshots (full project state)
export interface SnapshotEntry {
  id: string;
  name: string;
  files: FileNode[];
  timestamp: number;
}

export async function saveSnapshot(name: string, files: FileNode[]): Promise<SnapshotEntry> {
  const entry: SnapshotEntry = {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    files: JSON.parse(JSON.stringify(files)),
    timestamp: Date.now(),
  };
  await dbPut(STORE_SNAPSHOTS, entry);
  return entry;
}

export async function getSnapshots(): Promise<SnapshotEntry[]> {
  const all = await dbGetAll<SnapshotEntry>(STORE_SNAPSHOTS);
  return all.sort((a, b) => b.timestamp - a.timestamp);
}

export async function deleteSnapshot(id: string): Promise<void> {
  await dbDelete(STORE_SNAPSHOTS, id);
}

// Auto-recovery (unsaved changes)
export interface RecoveryEntry {
  fileId: string;
  fileName: string;
  content: string;
  timestamp: number;
}

export async function saveRecoveryState(files: FileNode[]): Promise<void> {
  for (const file of files) {
    if (file.type === 'file' && file.content !== undefined) {
      const entry: RecoveryEntry = {
        fileId: file.id,
        fileName: file.name,
        content: file.content,
        timestamp: Date.now(),
      };
      await dbPut(STORE_RECOVERY, entry);
    }
  }
}

export async function getRecoveryFiles(): Promise<RecoveryEntry[]> {
  return dbGetAll<RecoveryEntry>(STORE_RECOVERY);
}

export async function clearRecovery(): Promise<void> {
  await dbClear(STORE_RECOVERY);
}

// Local storage backup
export function backupToLocalStorage(files: FileNode[]): void {
  try {
    localStorage.setItem('python-studio-backup', JSON.stringify({ files, timestamp: Date.now() }));
  } catch {}
}

export function getLocalStorageBackup(): { files: FileNode[]; timestamp: number } | null {
  try {
    const data = localStorage.getItem('python-studio-backup');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

// Share link (data URL encoded)
export function generateShareLink(files: FileNode[], readOnly: boolean): string {
  const data = {
    version: '1.0',
    readOnly,
    files: files.filter(f => f.type === 'file').map(f => ({ name: f.name, content: f.content })),
    createdAt: new Date().toISOString(),
  };
  const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
  return `${window.location.origin}${window.location.pathname}#share=${encoded}`;
}

export function parseShareLink(): { readOnly: boolean; files: { name: string; content: string }[] } | null {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith('#share=')) return null;
    const encoded = hash.slice(7);
    const data = JSON.parse(decodeURIComponent(atob(encoded)));
    return { readOnly: data.readOnly, files: data.files };
  } catch { return null; }
}
