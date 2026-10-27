import http from 'node:http';
import path from 'node:path';
import {readFile,stat,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.mp4':'video/mp4','.webm':'video/webm','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
http.createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const target=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
    const relative=path.relative(root,target);
    if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403);return res.end();}
    // Windows is case-insensitive; Pages is not. Catch casing mistakes locally.
    let directory=root;
    for(const part of relative.split(path.sep)) {
      if(!(await readdir(directory)).includes(part)){res.writeHead(404);return res.end('Not found');}
      directory=path.join(directory,part);
    }
    if((await stat(target)).isDirectory()){res.writeHead(301,{Location:pathname+'/'});return res.end();}
    const body=await readFile(target);
    const headers={'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
    if(req.headers.range){
      const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
      const start=range?Number(range[1]):NaN, end=range&&range[2]?Math.min(Number(range[2]),body.length-1):body.length-1;
      if(!Number.isSafeInteger(start)||start>end||start>=body.length){res.writeHead(416,{'Content-Range':`bytes */${body.length}`});return res.end();}
      res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${body.length}`,'Content-Length':end-start+1});
      return res.end(req.method==='HEAD'?undefined:body.subarray(start,end+1));
    }
    res.writeHead(200,{...headers,'Content-Length':body.length});res.end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(4173,'127.0.0.1',()=>console.log('SignHub preview: http://127.0.0.1:4173'));
