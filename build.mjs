import {readFile,writeFile,mkdir,cp,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
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
await mkdir(path.join(dest,'legal'),{recursive:true});
await cp(path.join(root,'assets'),path.join(dest,'assets'),{recursive:true});
for(const file of ['index.html','robots.txt','.nojekyll'])await cp(path.join(root,file),path.join(dest,file));
for(const file of await readdir(path.join(root,'content'))){if(!file.endsWith('.md'))continue;
  const source=await readFile(path.join(root,'content',file),'utf8');const title=source.split('\n')[0].replace(/^# /,'');
  const html=`<!doctype html><html lang="es-CL"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escape(title)} de SignHub, OZZYDEV SpA."><title>${escape(title)} · SignHub</title><link rel="icon" href="../assets/logo.svg"><link rel="stylesheet" href="../assets/styles.css"></head><body><header class="wrap nav"><a class="brand" href="../"><img src="../assets/logo.svg" alt="">signhub.</a><a href="../">Volver al proyecto</a></header><main class="legal">${markdown(source)}<nav aria-label="Documentos"><a href="privacidad.html">Privacidad</a><a href="terminos.html">Términos</a><a href="eliminar-cuenta.html">Eliminar cuenta y datos</a><a href="menores.html">Menores</a><a href="comunidad.html">Comunidad</a><a href="promociones.html">Pilotos</a></nav></main><footer class="wrap footer-meta">${escape(config.company)} · RUT ${escape(config.rut)} · ${escape(config.location)}<br><a href="mailto:${escape(config.contact)}">${escape(config.contact)}</a> · Versión ${escape(config.legalVersion)}</footer>${file==='eliminar-cuenta.md'?'<script src="../assets/request.js" defer></script>':''}</body></html>`;
  await writeFile(path.join(dest,'legal',file.replace('.md','.html')),html);
}
console.log('Static website built: '+dest);
