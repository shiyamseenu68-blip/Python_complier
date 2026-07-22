import type { FileNode } from '../types';
import { getTheme } from '../data/themes';

function dl(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function base(name: string) { return name.replace(/\.[^/.]+$/, ''); }

function esc(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function highlight(code: string, theme: ReturnType<typeof getTheme>) {
  let r = esc(code);
  r = r.replace(/(#.*$)/gm, `<span style="color:${theme.muted};font-style:italic">$1</span>`);
  r = r.replace(/(["'])((?:\\.|(?!\1).)*)\1/g, `<span style="color:${theme.success}">$&</span>`);
  r = r.replace(/\b(def|class|return|if|elif|else|for|while|try|except|finally|with|as|import|from|in|not|and|or|is|None|True|False|lambda|yield|raise|pass|break|continue|global|nonlocal|async|await)\b/g,
    `<span style="color:${theme.accent};font-weight:600">$1</span>`);
  r = r.replace(/\b(\d+\.?\d*)\b/g, `<span style="color:${theme.warning}">$1</span>`);
  return r;
}

export function exportFile(file: FileNode, format: string, opts: { includeLineNumbers?: boolean; theme?: string; paperSize?: string; orientation?: string } = {}) {
  const content = file.content ?? '';
  const nm = base(file.name);
  const theme = getTheme(opts.theme ?? 'tokyo-night');

  if (format === 'py') return dl(new Blob([content], { type: 'text/x-python' }), `${nm}.py`);
  if (format === 'txt') return dl(new Blob([content], { type: 'text/plain' }), `${nm}.txt`);
  if (format === 'json') return dl(new Blob([JSON.stringify({ filename: file.name, content, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' }), `${nm}.json`);
  if (format === 'md') return dl(new Blob([`# ${file.name}\n\n\`\`\`python\n${content}\n\`\`\`\n`], { type: 'text/markdown' }), `${nm}.md`);
  if (format === 'csv') return dl(new Blob([content.split('\n').map(l => `"${l.replace(/"/g, '""')}"`).join('\n')], { type: 'text/csv' }), `${nm}.csv`);
  if (format === 'xml') return dl(new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n<file name="${esc(file.name)}">\n  <content><![CDATA[${content}]]></content>\n</file>`], { type: 'application/xml' }), `${nm}.xml`);
  if (format === 'yaml') return dl(new Blob([`filename: "${file.name}"\ncontent: |\n${content.split('\n').map(l => '  ' + l).join('\n')}\n`], { type: 'text/yaml' }), `${nm}.yaml`);

  if (format === 'html') {
    const h = highlight(content, theme);
    const lines = h.split('\n');
    const rows = opts.includeLineNumbers
      ? lines.map((l, i) => `<tr><td class="ln">${i + 1}</td><td>${l || '&nbsp;'}</td></tr>`).join('')
      : lines.map(l => `<tr><td>${l || '&nbsp;'}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${esc(file.name)}</title>
<style>body{margin:0;padding:20px;background:${theme.bg};font-family:'JetBrains Mono',monospace;color:${theme.text}}table{border-collapse:collapse}.ln{color:${theme.muted};text-align:right;padding-right:12px;opacity:.5;user-select:none;white-space:nowrap}td{white-space:pre}</style>
</head><body><table>${rows}</table></body></html>`;
    return dl(new Blob([html], { type: 'text/html' }), `${nm}.html`);
  }

  if (format === 'pdf') { exportPDF(file, content, opts); return; }
  if (['png', 'jpg', 'svg'].includes(format)) { exportImage(file, content, theme, format); return; }
}

async function exportPDF(file: FileNode, content: string, opts: any) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: opts.orientation ?? 'portrait', unit: 'mm', format: opts.paperSize ?? 'a4' });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const m = 15; let y = m + 5;
  pdf.setFontSize(13); pdf.setTextColor(80, 80, 80); pdf.text(file.name, m, y); y += 6;
  pdf.setFontSize(8); pdf.setTextColor(150, 150, 150); pdf.text(`Exported ${new Date().toLocaleString()}`, m, y); y += 7;
  pdf.setFont('courier', 'normal'); pdf.setFontSize(9); pdf.setTextColor(30, 30, 30);
  for (let i = 0; i < content.split('\n').length; i++) {
    if (y > H - m - 5) { pdf.addPage(); y = m + 5; }
    const ln = opts.includeLineNumbers ? `${String(i + 1).padStart(4)} ` : '';
    const wrapped = pdf.splitTextToSize(ln + content.split('\n')[i], W - 2 * m);
    pdf.text(wrapped, m, y); y += 4.5 * wrapped.length;
  }
  pdf.save(`${base(file.name)}.pdf`);
}

async function exportImage(file: FileNode, content: string, theme: ReturnType<typeof getTheme>, fmt: string) {
  const { toBlob, toSvg } = await import('html-to-image');
  const div = document.createElement('div');
  div.style.cssText = `position:fixed;left:-9999px;top:0;padding:24px;background:${theme.bg};font-family:'JetBrains Mono',monospace;`;
  div.innerHTML = `<div style="background:${theme.surface};border-radius:12px;padding:20px;box-shadow:0 8px 32px rgba(0,0,0,.3)">
    <div style="color:${theme.muted};font-size:11px;margin-bottom:10px">${esc(file.name)}</div>
    <pre style="margin:0;color:${theme.text};white-space:pre;font-size:13px">${highlight(content, theme)}</pre>
  </div>`;
  document.body.appendChild(div);
  try {
    if (fmt === 'svg') {
      const url = await toSvg(div, { pixelRatio: 2 });
      const a = document.createElement('a'); a.href = url; a.download = `${base(file.name)}.svg`; a.click();
    } else {
      const blob = await toBlob(div, { pixelRatio: 2, type: fmt === 'jpg' ? 'image/jpeg' : 'image/png' });
      if (blob) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${base(file.name)}.${fmt}`; a.click(); URL.revokeObjectURL(url); }
    }
  } finally { div.remove(); }
}

export async function exportProject(files: FileNode[], name = 'project.zip') {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  files.forEach(f => zip.file(f.name, f.content ?? ''));
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export async function importZip(file: File): Promise<{ name: string; content: string }[]> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(file);
  const results: { name: string; content: string }[] = [];
  for (const [path, entry] of Object.entries(zip.files)) {
    if (!entry.dir) {
      const content = await entry.async('string');
      results.push({ name: path.split('/').pop() ?? path, content });
    }
  }
  return results;
}
