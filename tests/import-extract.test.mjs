import test from 'node:test'
import assert from 'node:assert/strict'
import {Readable} from 'node:stream'
import {createPomaaHandler} from '../server/pomaa.mjs'
import {readAnyImport} from '../src/import-upload.mjs'
import {checkImportFile,extractionSheets} from '../src/import-formats.mjs'
const extracted={complete:true,notes:'Fictional records for QA.',tables:[{name:'Students',target:'students',headers:['name','group','phone'],rows:[['QA Scan Learner','Grade 9','0200123456']]}]}
const response=(data)=>new Response(JSON.stringify(data),{status:200})
const completed=data=>response({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(data)}]}]})
const request=(name='fictional.pdf',bytes=Buffer.from('%PDF-1.4\nFictional fixture'))=>({scope:'demo',context:{role:'Admin',allowedModules:['students']},file:{name,base64:bytes.toString('base64')}})
async function invoke(handler,body=request(),overrides={}){const req=Readable.from([JSON.stringify(body)]);Object.assign(req,{url:'/api/pomaa/import',method:'POST',headers:{host:'localhost'},socket:{remoteAddress:'127.0.0.1'},...overrides});let status,value;await handler(req,{writeHead(n){status=n},end(data){value=JSON.parse(data)}});return {status,value}}
const handler=fetchImpl=>createPomaaHandler({OPENAI_API_KEY:'fake-test-key'},{allowDemo:true,fetchImpl})
test('PDF extraction uses file input, strict output, no stored responses and no existing school records',async()=>{
 const result=await invoke(handler(async(url,options)=>{const body=JSON.parse(options.body);assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(body.store,false);assert.equal(body.text.format.strict,true);assert.equal(body.input[0].content[1].type,'input_file');assert.match(body.input[0].content[1].file_data,/data:application\/pdf;base64,/);assert(!body.instructions.includes('school records count'));return completed(extracted)}))
 assert.equal(result.status,200);assert.equal(result.value.tables[0].rows[0][2],'0200123456');assert(!JSON.stringify(result).includes('fake-test-key'))
})
test('JPG and PNG are sent as image inputs',async()=>{
 for(const [name,bytes,mime]of [['fictional.jpg',Buffer.from([255,216,255,0]),'image/jpeg'],['fictional.png',Buffer.from([137,80,78,71,13,10,26,10,0]),'image/png']]){
 const result=await invoke(handler(async(_url,options)=>{const input=JSON.parse(options.body).input[0].content[1];assert.equal(input.type,'input_image');assert(input.image_url.startsWith(`data:${mime};base64,`));return completed(extracted)}),request(name,bytes));assert.equal(result.status,200)
 }
})
test('audio is transcribed then extracted and transcript is returned for review',async()=>{
 let calls=0;const transcript='QA Scan Learner, Grade nine, phone zero two zero zero one two three four five six.'
 const result=await invoke(handler(async(url,options)=>{calls++;if(calls===1){assert.equal(url,'https://api.openai.com/v1/audio/transcriptions');assert(options.body instanceof FormData);assert.equal(options.body.get('file').name,'fictional.wav');return response({text:transcript})}assert(JSON.parse(options.body).input[0].content[1].text.includes(transcript));return completed(extracted)}),request('fictional.wav',Buffer.from('RIFF fictional audio fixture')))
 assert.equal(result.status,200);assert.equal(calls,2);assert.equal(result.value.transcript,transcript)
})
test('import rejects wrong media signatures, unauthorized roles, unknown files and incomplete or malformed extraction',async()=>{
 const noAI=handler(async()=>{throw new Error('Must not call AI')})
 assert.equal((await invoke(noAI,request('fake.png',Buffer.from('not png')))).status,400)
 assert.equal((await invoke(noAI,{...request(),context:{role:'Parent',allowedModules:['students']}})).status,403)
 assert.equal((await invoke(noAI,request('unknown.exe'))).status,400)
 assert.equal((await invoke(handler(async()=>completed({...extracted,complete:false})))).status,422)
 assert.equal((await invoke(handler(async()=>completed({...extracted,tables:[{...extracted.tables[0],target:'users'}]})))).status,403)
 assert.equal((await invoke(handler(async()=>completed({...extracted,tables:[{...extracted.tables[0],rows:[['wrong width']]}]})))).status,422)
 assert.equal((await invoke(createPomaaHandler({OPENAI_API_KEY:'test'},{fetchImpl:async()=>{throw new Error('No public demo')}}))).status,401)
})
test('large base64 payload is bounded without regex stack overflow',async()=>{
 const result=await invoke(handler(async()=>completed(extracted)),request('large.pdf',Buffer.concat([Buffer.from('%PDF-'),Buffer.alloc(5*1024*1024-5,32)])))
 assert.equal(result.status,200)
 assert.throws(()=>checkImportFile({name:'large.wav',size:5*1024*1024+1}),/5 MB/)
})
test('browser universal importer routes files correctly and preserves extracted provenance',async()=>{
 const bytes=Buffer.from('%PDF-1.4 fictional');const file={name:'fictional.pdf',size:bytes.length,arrayBuffer:async()=>bytes}
 const result=await readAnyImport(file,{allowed:['students'],fetchImpl:async(url,options)=>{assert.equal(url,'/api/pomaa/import');assert.equal(JSON.parse(options.body).context.role,'Admin');return response(extracted)}})
 assert.equal(result.sheets[0].aiExtracted,true);assert.equal(result.sheets[0].matrix[1][2],'0200123456')
 await assert.rejects(readAnyImport(file,{live:true}),/Sign in/)
 assert.throws(()=>extractionSheets({...extracted,complete:false},'x'),/entire file/)
})
