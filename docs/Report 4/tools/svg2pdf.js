// =====================================================================
// svg2pdf.js - export draw.io SVG diagrams to single-page VECTOR PDFs
//
// The LaTeX report (pdflatex) cannot embed SVG directly and the `svg`
// package requires Inkscape + --shell-escape.  Headless Chrome can print
// an SVG to a PDF in which every shape and every label stays vector, so
// the figures remain sharp at any zoom level inside the report.
//
// Usage (from docs/Report 4):
//   node tools/svg2pdf.js "images/sprint1/kvy/sequences/PostList.svg" ...
//   # or convert every Sprint 1 diagram:
//   node tools/svg2pdf.js images/sprint1/kvy/sequences/*.svg ... (see README)
//
// Each <name>.svg produces <name>.pdf next to it; the source SVG is
// never modified.
//
// Details:
//  * The draw.io exports carry `color-scheme: light dark` and CSS
//    `light-dark(light, dark)` colours.  The script resolves every
//    light-dark() pair to its LIGHT arm before rendering, so the output
//    is always the light theme regardless of the machine's dark mode.
//  * The HTML wrapper sets @page to the exact SVG size with zero margin,
//    so Chrome emits one page at a 1:1 scale.
//  * The SVG is embedded as a base64 data URI: no file:// access issues
//    and no path problems with spaces.
// =====================================================================
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const CHROME =
  process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE = path.join(os.tmpdir(), 'chrome_prof_svg2pdf');
const TMP = path.join(os.tmpdir(), 'svg2pdf_work');

// Replace every light-dark(a, b) by a (first top-level argument).
function resolveLightDark(src) {
  const needle = 'light-dark(';
  let out = '';
  let i = 0;
  for (;;) {
    const at = src.indexOf(needle, i);
    if (at < 0) {
      out += src.slice(i);
      break;
    }
    out += src.slice(i, at);
    let depth = 0;
    let j = at + needle.length - 1;
    let comma = -1;
    for (; j < src.length; j++) {
      const c = src[j];
      if (c === '(') depth++;
      else if (c === ')') {
        depth--;
        if (depth === 0) break;
      } else if (c === ',' && depth === 1 && comma < 0) {
        comma = j;
      }
    }
    if (j >= src.length) {
      out += src.slice(at);
      break;
    }
    const first =
      comma > 0 ? src.slice(at + needle.length, comma) : src.slice(at + needle.length, j);
    out += first;
    i = j + 1;
  }
  return out;
}

function convert(svgPath, pdfPath) {
  let raw = fs.readFileSync(svgPath, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);

  const m = raw.match(/<svg[^>]*?\swidth="(\d+(?:\.\d+)?)px"[^>]*?\sheight="(\d+(?:\.\d+)?)px"/);
  if (!m) throw new Error('cannot read width/height from ' + svgPath);
  const w = Math.round(parseFloat(m[1]));
  const h = Math.round(parseFloat(m[2]));

  raw = raw.replace(/color-scheme\s*:\s*light\s+dark/gi, 'color-scheme: light');
  raw = resolveLightDark(raw);

  const dataUri = 'data:image/svg+xml;base64,' + Buffer.from(raw, 'utf8').toString('base64');
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
@page { size: ${w}px ${h}px; margin: 0; }
html, body { margin: 0; padding: 0; background: #ffffff; }
img { display: block; width: ${w}px; height: ${h}px; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style></head>
<body><img src="${dataUri}"></body></html>`;

  fs.mkdirSync(TMP, { recursive: true });
  const id = path.basename(pdfPath, '.pdf').replace(/[^a-zA-Z0-9_-]+/g, '_') + '_' + process.pid;
  const htmlPath = path.join(TMP, id + '.html');
  fs.writeFileSync(htmlPath, html, 'utf8');

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--no-pdf-header-footer',
    '--user-data-dir=' + PROFILE,
    '--print-to-pdf=' + path.resolve(pdfPath),
    'file:///' + htmlPath.replace(/\\/g, '/'),
  ];
  const r = spawnSync(CHROME, args, { encoding: 'utf8', timeout: 180000 });
  fs.rmSync(htmlPath, { force: true });
  if (!fs.existsSync(pdfPath)) {
    throw new Error(
      'chrome failed for ' + svgPath + '\n' + (r.stderr || '') + (r.stdout || '')
    );
  }
  const size = fs.statSync(pdfPath).size;
  console.log(path.basename(pdfPath) + '  ' + w + 'x' + h + 'px  ' + Math.round(size / 1024) + ' KB');
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node tools/svg2pdf.js <diagram.svg ...>');
  process.exit(1);
}
for (const f of files) convert(f, f.replace(/\.svg$/i, '.pdf'));
