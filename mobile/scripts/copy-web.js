/* Copies the web app (repo root) into mobile/www for Capacitor. The service worker is left out: the native
 * app bundles every file, so it is already fully offline. */
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..', '..'), out = path.resolve(__dirname, '..', 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const files = ['index.html', 'privacy.html', 'manifest.webmanifest'];
files.forEach(f => { if (fs.existsSync(path.join(root, f))) fs.copyFileSync(path.join(root, f), path.join(out, f)); });
fs.cpSync(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
// native app does not need the service worker registration
const ix = path.join(out, 'index.html');
let html = fs.readFileSync(ix, 'utf8');
const sw = "if('serviceWorker'in navigator&&location.protocol.startsWith('http')){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}";
if (!html.includes(sw)) throw new Error('service worker snippet not found - update copy-web.js');
html = html.replace(sw, '/* service worker not used inside the native app */');
fs.writeFileSync(ix, html);
const n = (function c(d){return fs.readdirSync(d,{withFileTypes:true}).reduce((a,e)=>a+(e.isDirectory()?c(path.join(d,e.name)):1),0)})(out);
console.log('www ready:', n, 'files');
