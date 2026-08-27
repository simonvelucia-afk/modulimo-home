/**
 * Genere docs/immotique-pointe-est.pdf a partir du Markdown de l'etude.
 *   node docs/pdf/build-pdf.mjs
 * En-tete Modulimo sur chaque page, pied de page numerote, format Lettre.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const MD = path.join(ROOT, 'docs', 'immotique-pointe-est.md');
const LOGO = path.join(ROOT, 'images', 'ModulimoLogoSobre.png');
const OUT = path.join(ROOT, 'docs', 'immotique-pointe-est.pdf');
const PORT = 9333;

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const pw = '/opt/pw-browsers';
  if (fs.existsSync(pw)) {
    for (const d of fs.readdirSync(pw)) {
      const p = path.join(pw, d, 'chrome-linux', 'chrome');
      if (fs.existsSync(p)) return p;
    }
  }
  for (const c of ['chromium', 'chromium-browser', 'google-chrome']) {
    const r = spawnSync('which', [c], { encoding: 'utf8' });
    if (r.status === 0) return r.stdout.trim();
  }
  throw new Error('Chromium introuvable — definissez CHROME_PATH.');
}

// 1. Markdown -> HTML pret a imprimer
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'modulimo-pdf-'));
const html = path.join(tmp, 'etude.html');
const py = spawnSync('python3', [path.join(HERE, 'make-html.py'), MD, LOGO, html], { stdio: 'inherit' });
if (py.status !== 0) throw new Error('echec de make-html.py');

const logo64 = fs.readFileSync(LOGO).toString('base64');
const header = `
<div style="width:100%; font-family:Arial,Helvetica,sans-serif; font-size:7pt; color:#7A847F;
            padding:0 19mm; margin-top:8mm; display:flex; align-items:center;
            justify-content:space-between; border-bottom:0.5pt solid #DDE2DE; padding-bottom:2mm;">
  <img src="data:image/png;base64,${logo64}" style="height:5.2mm; width:auto;">
  <span style="letter-spacing:.09em; text-transform:uppercase;">Immotique et b&#226;timent Modulimo &#183; analyse interne</span>
</div>`;
const footer = `
<div style="width:100%; font-family:Arial,Helvetica,sans-serif; font-size:7pt; color:#7A847F;
            padding:0 19mm; margin-bottom:6mm; display:flex; align-items:center;
            justify-content:space-between;">
  <span style="letter-spacing:.06em;">MODULIMO &#183; document pr&#233;paratoire &#8212; ordres de grandeur &#224; valider</span>
  <span style="letter-spacing:.06em;"><span class="pageNumber"></span> / <span class="totalPages"></span></span>
</div>`;

// 2. Chromium en mode DevTools
const chrome = spawn(findChrome(), [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--hide-scrollbars', '--no-first-run', '--font-render-hinting=none',
  `--remote-debugging-port=${PORT}`, 'about:blank'
], { stdio: ['ignore', 'ignore', 'ignore'] });

const sleep = ms => new Promise(r => setTimeout(r, ms));
let version;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) { version = await r.json(); break; } }
  catch { /* pas encore pret */ }
  await sleep(250);
}
if (!version) { chrome.kill(); throw new Error('Chromium n\'a pas demarre'); }

const ws = new WebSocket(version.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const waiters = [];
ws.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id); pending.delete(m.id);
    m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
  } else if (m.method) {
    for (const w of [...waiters]) if (w.method === m.method) { waiters.splice(waiters.indexOf(w), 1); w.resolve(m); }
  }
});
await new Promise(r => ws.addEventListener('open', r, { once: true }));
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const i = ++id; pending.set(i, { resolve, reject });
  ws.send(JSON.stringify({ id: i, method, params, sessionId }));
});
const waitFor = (method, ms = 30000) => new Promise((resolve, reject) => {
  const w = { method, resolve }; waiters.push(w);
  setTimeout(() => { const i = waiters.indexOf(w); if (i >= 0) { waiters.splice(i, 1); reject(new Error('delai depasse : ' + method)); } }, ms);
});

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);

await S('Page.enable');
const loaded = waitFor('Page.loadEventFired');
await S('Page.navigate', { url: 'file://' + html });
await loaded;
await sleep(1200);

const { data } = await S('Page.printToPDF', {
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: header,
  footerTemplate: footer,
  paperWidth: 8.5, paperHeight: 11,
  marginTop: 0.83, marginBottom: 0.67, marginLeft: 0.75, marginRight: 0.75,
  preferCSSPageSize: false, scale: 1
});

fs.writeFileSync(OUT, Buffer.from(data, 'base64'));
console.log('PDF ecrit :', OUT, '(' + Math.round(fs.statSync(OUT).size / 1024) + ' Ko)');
ws.close(); chrome.kill(); fs.rmSync(tmp, { recursive: true, force: true });
process.exit(0);
