import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { pomaaContext, allowedPomaaActions } from '../src/pomaa-context.mjs'
import { createPomaaHandler } from '../server/pomaa.mjs'

const db={settings:{name:'Test school',currency:'GHS'},students:[{id:'s1',name:'Maya',email:'private@example.com',phone:'secret',group:'A'},{id:'s2',name:'Amara',group:'B'}],invoices:[{id:'i1',student:'Maya',amount:500},{id:'i2',student:'Amara',amount:1000}],payments:[{invoice:'i1',amount:100}],wellbeing:[{studentId:'s1',status:'Open',note:'private medical note'}]}
const request={scope:'demo',messages:[{role:'user',content:'What is outstanding?'}],context:pomaaContext(db)}
async function invoke(handler,body=request,overrides={}){const req=Readable.from([JSON.stringify(body)]);Object.assign(req,{url:'/api/pomaa',method:'POST',headers:{host:'localhost'},socket:{remoteAddress:'127.0.0.1'},...overrides});let status,value;const res={writeHead(n){status=n},end(data){value=JSON.parse(data)}};await handler(req,res);return {status,value}}
const successful=()=>new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({reply:'Outstanding fees are GHS 1,400.',actions:[]})}]}]}),{status:200})

test('learner context excludes other learners, contacts and welfare notes',()=>{
  const context=pomaaContext(db,{role:'Parent',learnerId:'s1',allowed:['students','fees','progress']});const text=JSON.stringify(context)
  assert.equal(context.finance.outstanding,400);assert(!text.includes('Amara'));assert(!text.includes('private@example.com'));assert(!text.includes('secret'));assert(!text.includes('private medical note'))
})
test('server keeps AI actions within role and modules',()=>{
  const actions=[{type:'navigate',module:'settings',label:'Settings'},{type:'draft_message',label:'Draft',body:'Hi parents'},{type:'navigate',module:'fees',label:'Fees'}]
  assert.deepEqual(allowedPomaaActions(actions,['fees','communications'],'Parent').map(a=>a.module),['fees'])
})
test('local demo reaches Responses API without storing responses or exposing key',async()=>{
  const handler=createPomaaHandler({OPENAI_API_KEY:'test-key'},{allowDemo:true,fetchImpl:async(url,opts)=>{const body=JSON.parse(opts.body);assert.equal(body.store,false);assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(opts.headers.Authorization,'Bearer test-key');return successful()}})
  const result=await invoke(handler);assert.equal(result.status,200);assert(!JSON.stringify(result).includes('test-key'))
})
test('production rejects public demo and cross-origin requests',async()=>{
  const handler=createPomaaHandler({OPENAI_API_KEY:'test-key'},{fetchImpl:()=>{throw new Error('Should not call AI')}})
  assert.equal((await invoke(handler)).status,401)
  assert.equal((await invoke(handler,request,{headers:{host:'localhost',origin:'https://external.example'}})).status,403)
})
test('live requests validate the user and load the owner workspace, ignoring browser context',async()=>{
  let checked=false
  const clientFactory=()=>({auth:{getUser:async token=>{assert.equal(token,'session-token');return {data:{user:{id:'owner-1'}}}}},from:table=>{assert.equal(table,'school_workspaces');return {select:()=>({eq:(column,id)=>{assert.equal(column,'owner_id');assert.equal(id,'owner-1');checked=true;return {maybeSingle:async()=>({data:{data:db}})}}})}}})
  const handler=createPomaaHandler({OPENAI_API_KEY:'test-key',VITE_SUPABASE_URL:'https://example.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'public-key'},{clientFactory,fetchImpl:async(_url,opts)=>{assert(!JSON.parse(opts.body).instructions.includes('FORGED CONTEXT'));return successful()}})
  const result=await invoke(handler,{...request,scope:'live',context:{school:'FORGED CONTEXT'}},{headers:{host:'localhost',authorization:'Bearer session-token'}});assert.equal(result.status,200);assert(checked)
})
test('missing credentials and OpenAI credit failures are explicit',async()=>{
  assert.equal((await invoke(createPomaaHandler({},{allowDemo:true}))).status,503)
  const handler=createPomaaHandler({OPENAI_API_KEY:'test-key'},{allowDemo:true,fetchImpl:async()=>new Response(JSON.stringify({error:{code:'insufficient_quota'}}),{status:429})})
  const result=await invoke(handler);assert.equal(result.status,429);assert.match(result.value.error,/API credit/)
})
