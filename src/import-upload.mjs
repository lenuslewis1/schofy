import {readImportFile} from './import-file.mjs'
import {checkImportFile,structuredExtensions,extractionSheets} from './import-formats.mjs'

export async function readAnyImport(file,{live=false,role='Admin',allowed=[],token,signal,fetchImpl=fetch}={}){
 const extension=checkImportFile(file)
 if(structuredExtensions.includes(extension))return {sheets:await readImportFile(file),notes:'',transcript:''}
 if(live&&!token)throw new Error('Sign in again before uploading your file.')
 const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192))
 const headers={'Content-Type':'application/json'};if(token)headers.Authorization=`Bearer ${token}`
 const response=await fetchImpl('/api/pomaa/import',{method:'POST',headers,signal,body:JSON.stringify({scope:live?'live':'demo',...(!live?{context:{role,allowedModules:allowed}}:{}),file:{name:file.name,base64:btoa(binary)}})})
 const answer=await response.json().catch(()=>({error:'Pomaa’s file service is unavailable. Start the app server and retry.'}))
 if(!response.ok)throw new Error(answer.error||'Pomaa could not read this file.')
 return {sheets:extractionSheets(answer,file.name),notes:answer.notes||'',transcript:answer.transcript||''}
}
