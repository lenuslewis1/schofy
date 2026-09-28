import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { loadEnv } from 'vite'
import { createPomaaHandler } from './pomaa.mjs'

const env={...loadEnv('production',process.cwd(),''),...process.env},root=resolve('dist')
const api=createPomaaHandler(env)
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json','.ico':'image/x-icon','.webp':'image/webp'}
const server=createServer((req,res)=>api(req,res,async()=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end('Method not allowed')}
  try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(root,'.'+path)
    if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);return res.end('Forbidden')}
    let content,type=mime[extname(file)]||'application/octet-stream'
    try{content=await readFile(file)}catch{if(extname(file)){res.writeHead(404);return res.end('Not found')}content=await readFile(resolve(root,'index.html'));type='text/html'}
    res.writeHead(200,{'Content-Type':type,'X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:content)
  }catch{res.writeHead(404);res.end('Not found')}
}))
server.listen(Number(env.PORT||4173),env.HOST||'127.0.0.1',()=>console.log(`Schofy and Pomaa: http://${env.HOST||'127.0.0.1'}:${env.PORT||4173}`))
