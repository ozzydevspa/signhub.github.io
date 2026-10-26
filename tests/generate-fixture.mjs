// Development-only synthetic video. Never copied to dist or presented as interpretation.
// Usage: node tests/generate-fixture.mjs /absolute/path/to/ffmpeg
import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const encoder = process.argv[2];
if (!encoder) throw Error('Pass an FFmpeg executable with MJPEG decoding and VP9 encoding.');
const target = new URL('fixtures/test-pattern.webm', import.meta.url);
await mkdir(new URL('fixtures/', import.meta.url), {recursive: true});
const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 640, height: 360}});
await page.setContent('<body style="margin:0;background:#194261;color:white;display:grid;place-items:center;height:100vh;font-family:Arial"><div style="text-align:center"><h1>VIDEO DE PRUEBA</h1><p>Patrón sintético · No es interpretación</p></div></body>');
const jpeg = await page.screenshot({type: 'jpeg'});
await browser.close();
const proc = spawn(encoder, ['-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', '20', '-i', 'pipe:0', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p', fileURLToPath(target)], {stdio: ['pipe', 'ignore', 'pipe']});
let error = '';
proc.stderr.on('data', data => error += data);
proc.stdin.on('error', () => {});
for (let i = 0; i < 120; i++) proc.stdin.write(jpeg);
proc.stdin.end();
const code = await new Promise((resolve, reject) => {proc.on('close', resolve); proc.on('error', reject);});
if (code !== 0) throw Error(error);
console.log('Created six-second synthetic test fixture.');
