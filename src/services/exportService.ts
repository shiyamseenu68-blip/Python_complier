import type { FileNode } from '../types';
import { getTheme } from '../data/themes';

export type ExportFormat = 'py' | 'txt' | 'json' | 'html' | 'md' | 'csv' | 'xml' | 'yaml' | 'zip' | 'pdf' | 'png' | 'jpg' | 'svg' | 'webp';

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getBaseName(name: string): string {
  return name.replace(/\.[^/.]+$/, '');
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightPython(code: string, theme: ReturnType<typeof getTheme>): string {
  const keywords = /\b(def|class|return|if|elif|else|for|while|try|except|finally|with|as|import|from|in|not|and|or|is|None|True|False|lambda|yield|raise|pass|break|continue|global|nonlocal|assert|del|async|await)\b/g;
  const strings = /(["'])((?:\\.|(?!\1).)*)\1/g;
  const comments = /(#.*$)/gm;
  const numbers = /\b(\d+\.?\d*)\b/g;
  const funcs = /\b(def\s+)(\w+)/g;

  let result = escapeHtml(code);
  result = result.replace(comments, `<span style="color:${theme.muted};font-style:italic">$1</span>`);
  result = result.replace(strings, `<span style="color:${theme.success}">$&</span>`);
  result = result.replace(keywords, `<span style="color:${theme.accent};font-weight:600">$1</span>`);
  result = result.replace(numbers, `<span style="color:${theme.warning}">$1</span>`);
  result = result.replace(funcs, `$1<span style="color:${theme.accent};font-weight:600">$2</span>`);
  return result;
}

export function exportFile(file: FileNode, format: ExportFormat, options?: {
  includeLineNumbers?: boolean;
  theme?: string;
  header?: string;
  footer?: string;
  watermark?: string;
  paperSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  darkTheme?: boolean;
  transparentBg?: boolean;
  customBg?: string;
  roundedCorners?: boolean;
  shadow?: boolean;
  resolution?: number;
}) {
  const content = file.content ?? '';
  const baseName = getBaseName(file.name);
  const theme = getTheme(options?.theme ?? 'tokyo-night');

  switch (format) {
    case 'py': {
      download(new Blob([content], { type: 'text/x-python' }), `${baseName}.py`);
      return;
    }
    case 'txt': {
      download(new Blob([content], { type: 'text/plain' }), `${baseName}.txt`);
      return;
    }
    case 'json': {
      const data = { filename: file.name, content, language: file.language, exportedAt: new Date().toISOString() };
      download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `${baseName}.json`);
      return;
    }
    case 'md': {
      const md = `# ${file.name}\n\n> Exported from Python Studio on ${new Date().toLocaleString()}\n\n\`\`\`${file.language ?? 'python'}\n${content}\n\`\`\`\n`;
      download(new Blob([md], { type: 'text/markdown' }), `${baseName}.md`);
      return;
    }
    case 'csv': {
      const lines = content.split('\n');
      const csv = lines.map(line => line.split(',').map((cell, i) => i === 0 ? cell : `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
      download(new Blob([csv], { type: 'text/csv' }), `${baseName}.csv`);
      return;
    }
    case 'xml': {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<file name="${escapeXml(file.name)}" language="${file.language ?? 'python'}" exportedAt="${new Date().toISOString()}">\n  <content><![CDATA[${content}]]></content>\n</file>`;
      download(new Blob([xml], { type: 'application/xml' }), `${baseName}.xml`);
      return;
    }
    case 'yaml': {
      const yaml = `filename: "${file.name}"\nlanguage: "${file.language ?? 'python'}"\nexportedAt: "${new Date().toISOString()}"\ncontent: |\n${content.split('\n').map(l => '  ' + l).join('\n')}\n`;
      download(new Blob([yaml], { type: 'text/yaml' }), `${baseName}.yaml`);
      return;
    }
    case 'html': {
      const highlighted = highlightPython(content, theme);
      const lines = highlighted.split('\n');
      const numbered = options?.includeLineNumbers
        ? lines.map((l, i) => `<tr><td class="ln">${i + 1}</td><td class="code">${l || '&nbsp;'}</td></tr>`).join('')
        : lines.map(l => `<tr><td class="code">${l || '&nbsp;'}</td></tr>`).join('');
      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${escapeHtml(file.name)}</title>
<style>
body { margin: 0; padding: 24px; background: ${options?.transparentBg ? 'transparent' : (options?.customBg ?? theme.bg)}; font-family: 'JetBrains Mono', monospace; }
.code-block { background: ${theme.surface}; border-radius: ${options?.roundedCorners ? '12px' : '0'}; ${options?.shadow ? 'box-shadow: 0 8px 32px rgba(0,0,0,0.3);' : ''} padding: 20px; overflow-x: auto; }
table { border-collapse: collapse; width: 100%; }
.ln { color: ${theme.muted}; text-align: right; padding-right: 16px; user-select: none; opacity: 0.6; width: 1%; white-space: nowrap; }
.code { white-space: pre; color: ${theme.text}; }
.header { color: ${theme.muted}; font-size: 12px; margin-bottom: 12px; }
.footer { color: ${theme.muted}; font-size: 12px; margin-top: 12px; }
</style></head><body>
${options?.header ? `<div class="header">${escapeHtml(options.header)}</div>` : ''}
<div class="code-block"><table>${numbered}</table></div>
${options?.footer ? `<div class="footer">${escapeHtml(options.footer)}</div>` : ''}
</body></html>`;
      download(new Blob([html], { type: 'text/html' }), `${baseName}.html`);
      return;
    }
    case 'pdf': {
      generatePDF(file, content, theme, options);
      return;
    }
    case 'png':
    case 'jpg':
    case 'svg':
    case 'webp': {
      generateImage(file, content, theme, format, options);
      return;
    }
    case 'zip': {
      exportProject([file], `${baseName}.zip`);
      return;
    }
  }
}

async function generatePDF(file: FileNode, content: string, theme: ReturnType<typeof getTheme>, options?: any) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({
    orientation: options?.orientation ?? 'portrait',
    unit: 'mm',
    format: options?.paperSize ?? 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const lineHeight = 5;
  let y = margin + 8;

  // Header
  if (options?.header) {
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text(options.header, margin, y - 4);
  }

  pdf.setFontSize(14);
  pdf.setTextColor(theme.isDark ? 200 : 50, theme.isDark ? 200 : 50, theme.isDark ? 200 : 50);
  pdf.text(file.name, margin, y);
  y += 6;

  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Exported: ${new Date().toLocaleString()}`, margin, y);
  y += 8;

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(9);

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (y > pageHeight - margin - 10) {
      if (options?.footer) {
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(options.footer, margin, pageHeight - 8);
      }
      pdf.addPage();
      y = margin + 5;
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(9);
    }

    const lineNum = options?.includeLineNumbers ? `${String(i + 1).padStart(4, ' ')}  ` : '';
    const line = lines[i];

    if (line.trim().startsWith('#')) {
      pdf.setTextColor(120, 120, 120);
    } else {
      pdf.setTextColor(theme.isDark ? 220 : 30, theme.isDark ? 220 : 30, theme.isDark ? 220 : 30);
    }

    const displayLine = lineNum + line;
    const wrapped = pdf.splitTextToSize(displayLine, pageWidth - 2 * margin);
    pdf.text(wrapped, margin, y);
    y += lineHeight * wrapped.length;
  }

  if (options?.watermark) {
    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(40);
    pdf.text(options.watermark, pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
  }

  if (options?.footer) {
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(options.footer, margin, pageHeight - 8);
  }

  pdf.save(`${getBaseName(file.name)}.pdf`);
}

async function generateImage(file: FileNode, content: string, theme: ReturnType<typeof getTheme>, format: ExportFormat, options?: any) {
  const { toSvg: htmlToSvg, toBlob: htmlToBlob } = await import('html-to-image');
  const highlighted = highlightPython(content, theme);
  const lines = highlighted.split('\n');
  const lineNumberHtml = options?.includeLineNumbers
    ? lines.map((l, i) => `<tr><td class="ln">${i + 1}</td><td>${l || '&nbsp;'}</td></tr>`).join('')
    : lines.map(l => `<tr><td>${l || '&nbsp;'}</td></tr>`).join('');

  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0; padding: 24px;
    background: ${options?.transparentBg ? 'transparent' : (options?.customBg ?? theme.bg)};
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
  `;
  container.innerHTML = `
    <div style="background:${theme.surface};border-radius:${options?.roundedCorners ? '12px' : '0'};${options?.shadow ? 'box-shadow:0 8px 32px rgba(0,0,0,0.3);' : ''}padding:20px;overflow:hidden;">
      <div style="color:${theme.muted};font-size:12px;margin-bottom:12px;">${escapeHtml(file.name)} — ${new Date().toLocaleString()}</div>
      <table style="border-collapse:collapse;"><tr><td class="ln" style="color:${theme.muted};text-align:right;padding-right:16px;opacity:0.6;white-space:nowrap;"></td><td style="white-space:pre;color:${theme.text};">${lineNumberHtml}</td></tr></table>
    </div>
  `;
  document.body.appendChild(container);

  try {
    const pixelRatio = (options?.resolution ?? 2) / 2;
    if (format === 'svg') {
      const dataUrl = await htmlToSvg(container, { pixelRatio, backgroundColor: options?.transparentBg ? undefined : (options?.customBg ?? theme.bg) });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${getBaseName(file.name)}.svg`;
      a.click();
    } else if (format === 'webp') {
      const blob = await htmlToBlob(container, { pixelRatio, backgroundColor: options?.transparentBg ? undefined : (options?.customBg ?? theme.bg) });
      // Convert to webp via canvas
      const img = new Image();
      img.src = URL.createObjectURL(blob ?? new Blob());
      await new Promise(r => img.onload = r);
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      canvas.toBlob(b => { if (b) download(b, `${getBaseName(file.name)}.webp`); }, 'image/webp');
    } else {
      const blob = await htmlToBlob(container, {
        pixelRatio,
        backgroundColor: options?.transparentBg ? undefined : (options?.customBg ?? theme.bg),
        type: format === 'jpg' ? 'image/jpeg' : 'image/png',
        quality: 0.95,
      });
      if (blob) download(blob, `${getBaseName(file.name)}.${format}`);
    }
  } finally {
    container.remove();
  }
}

export async function exportProject(files: FileNode[], zipName: string = 'project.zip') {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  for (const file of files) {
    if (file.type === 'file') {
      zip.file(file.name, file.content ?? '');
    }
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  download(blob, zipName);
}

export async function exportProjectAsJSON(files: FileNode[], settings: any) {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    files: files.filter(f => f.type === 'file').map(f => ({ name: f.name, content: f.content, language: f.language })),
    settings,
  };
  download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'project-export.json');
}

export async function importProjectZip(file: File): Promise<{ name: string; content: string }[]> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(file);
  const result: { name: string; content: string }[] = [];
  const entries = Object.values(zip.files);
  for (const entry of entries) {
    if (!entry.dir) {
      const content = await entry.async('string');
      result.push({ name: entry.name.split('/').pop() ?? entry.name, content });
    }
  }
  return result;
}

export async function importProjectJSON(file: File): Promise<{ name: string; content: string; language?: string }[]> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (data.files && Array.isArray(data.files)) {
    return data.files.map((f: any) => ({ name: f.name, content: f.content, language: f.language }));
  }
  return [];
}

export function printCode(file: FileNode, options: {
  includeLineNumbers?: boolean;
  syntaxHighlight?: boolean;
  theme?: string;
  paperSize?: string;
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  scale?: number;
  header?: string;
  footer?: string;
}) {
  const theme = getTheme(options.theme ?? 'tokyo-night');
  const content = file.content ?? '';
  const highlighted = options.syntaxHighlight ? highlightPython(content, theme) : escapeHtml(content);
  const lines = highlighted.split('\n');
  const lineNumberCss = options.includeLineNumbers
    ? `.ln { color: ${theme.muted}; text-align: right; padding-right: 12px; opacity: 0.6; width: 1%; white-space: nowrap; }`
    : '';
  const numbered = options.includeLineNumbers
    ? lines.map((l, i) => `<tr><td class="ln">${i + 1}</td><td>${l || '&nbsp;'}</td></tr>`).join('')
    : lines.map(l => `<tr><td>${l || '&nbsp;'}</td></tr>`).join('');

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Print ${file.name}</title>
<style>
@page { size: ${options.paperSize ?? 'A4'} ${options.orientation ?? 'portrait'}; margin: ${options.margin ?? 15}mm; }
body { font-family: 'JetBrains Mono', monospace; background: white; color: #1e1e1e; margin: 0; padding: 16px; transform: scale(${(options.scale ?? 100) / 100}); }
.header { font-size: 10px; color: #888; margin-bottom: 8px; }
.title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.meta { font-size: 9px; color: #aaa; margin-bottom: 12px; }
table { border-collapse: collapse; width: 100%; }
td { white-space: pre; }
.footer { font-size: 9px; color: #aaa; margin-top: 12px; }
${lineNumberCss}
</style></head><body>
${options.header ? `<div class="header">${escapeHtml(options.header)}</div>` : ''}
<div class="title">${escapeHtml(file.name)}</div>
<div class="meta">Exported: ${new Date().toLocaleString()}</div>
<table>${numbered}</table>
${options.footer ? `<div class="footer">${escapeHtml(options.footer)}</div>` : ''}
<script>window.onload = () => { setTimeout(() => window.print(), 300); }</script>
</body></html>`);
  win.document.close();
}
