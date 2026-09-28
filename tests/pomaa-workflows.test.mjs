import test from 'node:test'
import assert from 'node:assert/strict'
import {workflowsFor,policyContext} from '../src/pomaa-workflows.mjs'
import {allowedPomaaActions,pomaaModules} from '../src/pomaa-context.mjs'
import {readAssistantFile} from '../server/pomaa-files.mjs'
test('staff workflows are filtered for learner roles and module access',()=>{
 assert.equal(workflowsFor('Admin',pomaaModules).length,11)
 assert(!workflowsFor('Parent',pomaaModules).some(w=>w.staff))
 assert(!workflowsFor('Teacher',['classes']).some(w=>w.id==='fees'))
})
test('private policy sources do not reach learners',()=>{
 const db={aiPolicies:[{id:'1',title:'Staff handbook',text:'Private',audience:'Staff'},{id:'2',title:'School rules',text:'Public',audience:'Everyone'}]}
 assert.deepEqual(policyContext(db,'Student').map(p=>p.id),['2'])
 assert.equal(policyContext(db,'Teacher').length,2)
})
test('draft resources cannot bypass role, module or size limits',()=>{
 const action={type:'draft_resource',module:'results',label:'Comment',body:'Review me'}
 assert.equal(allowedPomaaActions([action],['results'],'Parent').length,0)
 assert.equal(allowedPomaaActions([action],['classes'],'Teacher').length,0)
 assert.equal(allowedPomaaActions([{...action,body:'x'.repeat(12001)}],['results'],'Teacher').length,0)
 assert.equal(allowedPomaaActions([action],['results'],'Teacher')[0].body,'Review me')
})
const file={name:'handbook.txt',base64:Buffer.from('Attendance: arrive by 8am.').toString('base64')}
const output=(text,complete=true)=>new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({text,complete})}]}]}))
test('policy extraction uses Luna, disables storage and rejects incomplete sources',async()=>{
 const result=await readAssistantFile({file},{OPENAI_API_KEY:'fake'},async(url,options)=>{const body=JSON.parse(options.body);assert.equal(body.model,'gpt-6-luna');assert.equal(body.store,false);return output('Attendance: arrive by 8am.')})
 assert.match(result.text,/8am/)
 await assert.rejects(()=>readAssistantFile({file},{OPENAI_API_KEY:'fake'},async()=>output('Partial',false)),/shorter document/)
 await assert.rejects(()=>readAssistantFile({file},{OPENAI_API_KEY:'fake'},async()=>output('x'.repeat(6001))),/shorter document/)
})
test('voice accepts audio only and returns transcript for review',async()=>{
 await assert.rejects(()=>readAssistantFile({file},{},async()=>{}, {voice:true}),/audio recording/)
 const audio={name:'instructions.webm',base64:Buffer.from('fixture audio').toString('base64')}
 const result=await readAssistantFile({file:audio},{OPENAI_API_KEY:'fake'},async(url,options)=>{assert.match(url,/transcriptions/);assert.equal(options.body.get('model'),'gpt-4o-mini-transcribe');return new Response(JSON.stringify({text:'Prepare today’s briefing.'}))},{voice:true})
 assert.match(result.text,/briefing/)
})
