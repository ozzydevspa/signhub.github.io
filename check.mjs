import {readFile,readdir,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';import path from 'node:path';import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
async function walk(dir){let all=[];for(const item of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,item.name);all.push(...(item.isDirectory()?await walk(p):[p]));}return all;}
let count=0;
for(const file of await walk(root)){
  if(!file.endsWith('.html'))continue;const html=await readFile(file,'utf8');
  assert.match(html,/<html lang="es-CL">/);assert.match(html,/<main/);assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
  assert(!/service_role|SUPABASE_ANON_KEY|sb_secret_/i.test(html),'Private configuration in public HTML');
  assert(!html.includes('href="#"'),'Dead link');
  for(const [,target] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(/^(https?:|mailto:)/.test(target))continue;
    if(target.startsWith('#')){assert(html.includes(`id="${target.slice(1)}"`),'Missing anchor '+target);continue;}
    const full=path.resolve(path.dirname(file),target.split('#')[0]);const relative=path.relative(root,full);assert(!relative.startsWith('..')&&!path.isAbsolute(relative),'Asset escapes published directory');
    await stat(full);count++;
  }
}
console.log(`PASS: document structure and ${count} local links/assets; no private configuration markers in HTML.`);
