import {readFile,writeFile,mkdir,cp,readdir,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {validateInterpretations, renderInterpretations} from './lib/interpretations.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const dest=path.join(root,'dist');
const config=JSON.parse(await readFile(path.join(root,'site.config.json'),'utf8'));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const inline=s=>escape(s).replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,label,url)=>{
  if(!/^(https:\/\/|mailto:|[a-z][a-z-]*\.html$)/.test(url)) throw Error('Unsupported document link');
  return `<a href="${url}">${label}</a>`;
}).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
const form=`<form id="privacy-request"><label>Solicitud<select name="kind"><option>Eliminar cuenta y datos</option><option>Eliminar datos concretos</option><option>Acceso o copia de datos</option><option>Rectificación</option><option>Oposición o retiro de consentimiento</option><option>Solicitud de representante</option></select></label><label>Correo de la cuenta<input name="email" type="email" autocomplete="email" required maxlength="254"></label><label>Detalle mínimo necesario<textarea name="details" maxlength="2000" placeholder="Indica el alcance de tu solicitud. No incluyas contraseñas ni documentos de identidad."></textarea></label><button class="button" type="submit">Preparar correo</button><p role="status" id="request-status"></p></form>`;
function markdown(source){let output='',list=false;for(const line of source.split(/\r?\n/)){
  if(!line.startsWith('- ')&&list){output+='</ul>';list=false;}
  if(line.startsWith('- ')){if(!list){output+='<ul>';list=true;}output+=`<li>${inline(line.slice(2))}</li>`;}
  else if(line==='<!-- request-form -->')output+=form;
  else if(/^#{1,3} /.test(line)){const n=line.indexOf(' ');output+=`<h${n}>${inline(line.slice(n+1))}</h${n}>`;}
  else if(line.trim())output+=`<p>${inline(line)}</p>`;
}return output+(list?'</ul>':'');}
// Remove only this build's fixed output directory; never source files.
if(dest!==path.join(root,'dist')) throw Error('Invalid output directory');
await rm(dest,{recursive:true,force:true});
await mkdir(path.join(dest,'signhub','legal'),{recursive:true});
await mkdir(path.join(dest,'legal'),{recursive:true});
await cp(path.join(root,'assets'),path.join(dest,'assets'),{recursive:true});
const landing = await readFile(path.join(root,'index.html'),'utf8');
const interpretations = JSON.parse(await readFile(path.join(root,'interpretations.json'),'utf8'));
await validateInterpretations(interpretations, landing, root);
const landingAssets=landing.replaceAll('="assets/', '="../assets/');
const nestedMedia=structuredClone(interpretations);
for(const block of nestedMedia.blocks) for(const key of ['src','poster']) {
  if(block[key]?.startsWith('assets/')) block[key]='../'+block[key];
}
await writeFile(path.join(dest,'signhub','index.html'),renderInterpretations(nestedMedia, landingAssets).replace('src="assets/interpretations.js"','src="../assets/interpretations.js"'));
await cp(path.join(root,'corporate.html'),path.join(dest,'index.html'));
const basePath=process.env.PAGES_BASE_PATH || '';
if(basePath && !/^\/[a-zA-Z0-9._-]+$/.test(basePath)) throw Error('Invalid Pages base path');
await writeFile(path.join(dest,'404.html'),`<!doctype html><html lang="es-CL"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Página no encontrada · OZZYDEV</title></head><body><main><h1>Página no encontrada</h1><p>Revisa la dirección; las rutas distinguen mayúsculas y minúsculas.</p><p><a href="${basePath}/">OZZYDEV</a> · <a href="${basePath}/signhub/">SignHub</a></p></main></body></html>`);
for(const file of ['robots.txt','.nojekyll'])await cp(path.join(root,file),path.join(dest,file));
for(const file of await readdir(path.join(root,'content'))){if(!file.endsWith('.md'))continue;
  const source=await readFile(path.join(root,'content',file),'utf8');const title=source.split('\n')[0].replace(/^# /,'');
  const html=`<!doctype html><html lang="es-CL"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escape(title)} de SignHub, OZZYDEV SpA."><title>${escape(title)} · SignHub</title><link rel="canonical" href="${escape(config.url)}legal/${file.replace('.md','.html')}"><link rel="icon" href="../../assets/logo.svg"><link rel="stylesheet" href="../../assets/styles.css"></head><body><header class="wrap nav"><a class="brand" href="../"><img src="../../assets/logo.svg" alt="">signhub.</a><a href="../">Volver al proyecto</a></header><main class="legal">${markdown(source)}<nav aria-label="Documentos"><a href="privacidad.html">Privacidad</a><a href="terminos.html">Términos</a><a href="eliminar-cuenta.html">Eliminar cuenta y datos</a><a href="menores.html">Menores</a><a href="comunidad.html">Comunidad</a><a href="promociones.html">Pilotos</a></nav></main><footer class="wrap footer-meta">${escape(config.company)} · RUT ${escape(config.rut)} · ${escape(config.location)}<br><a href="mailto:${escape(config.support)}">Soporte: ${escape(config.support)}</a> · <a href="mailto:${escape(config.privacy)}">Privacidad: ${escape(config.privacy)}</a> · Versión ${escape(config.legalVersion)}</footer>${file==='eliminar-cuenta.md'?'<script src="../../assets/request.js" defer></script>':''}</body></html>`;
  await writeFile(path.join(dest,'signhub','legal',file.replace('.md','.html')),html);
  // Keep real documents at legacy paths for installed apps, including without JS.
  const legacy=html.replaceAll('../../assets/','../assets/').replaceAll('href="../"','href="../signhub/"');
  await writeFile(path.join(dest,'legal',file.replace('.md','.html')),legacy);
}
console.log('Static website built: '+dest);
