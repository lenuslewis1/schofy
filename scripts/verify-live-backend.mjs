import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { createWorkspace, loadWorkspace, saveWorkspace } from '../src/cloudStore.js'

// This script is deliberately tied to the newly-created Schofy project.
// Admin credentials are held only in process memory, never printed or saved.
const project = 'vpwvhohvykyvzubxlinb'
const env = Object.fromEntries((await readFile('.env.local','utf8')).split(/\r?\n/).filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]))
assert.equal(env.VITE_SUPABASE_URL, `https://${project}.supabase.co`)
const output = execFileSync('powershell.exe',['-NoProfile','-Command',`npm exec --yes --cache .npm-cache --package supabase@2.118.0 -- supabase projects api-keys --project-ref ${project} --reveal --output json`],{encoding:'utf8',stdio:['ignore','pipe','pipe']})
let parsed
try { parsed = JSON.parse(output.trim()) } catch { throw new Error('CLI returned an unexpected API-key response.') }
const list = Array.isArray(parsed) ? parsed : parsed.keys || parsed.api_keys
if(!Array.isArray(list)) throw new Error('CLI API-key response has an unsupported shape.')
const adminKey = list.find(k=>k.name==='service_role' || (k.type==='secret'&&!k.disabled))?.api_key
if(!adminKey) throw new Error('Admin credential unavailable for live verification.')
const options = {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(url,init={})=>fetch(url,{...init,signal:AbortSignal.timeout(20000)})}}
const admin = createClient(env.VITE_SUPABASE_URL,adminKey,options)
const publicClient = () => createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,options)
const created = [], clients = []
function ok(result){if(result.error) throw result.error;return result.data}
// Clean up only fictional accounts from interrupted runs of this verification script.
const previous = ok(await admin.auth.admin.listUsers()).users.filter(u=>/^schofy-qa-[0-9a-f-]+@example\.com$/.test(u.email||''))
for(const user of previous) ok(await admin.auth.admin.deleteUser(user.id))
try {
  for(let i=0;i<2;i++){
    const email = `schofy-qa-${randomUUID()}@example.com`, password = `Qa-${randomUUID()}!`
    const {user} = ok(await admin.auth.admin.createUser({email,password,email_confirm:true}))
    created.push(user.id)
    const client = publicClient(); clients.push(client)
    const login = ok(await client.auth.signInWithPassword({email,password}))
    assert.equal(login.user.id,user.id)
    assert.equal(ok(await client.auth.getUser()).user.id,user.id)
  }
  console.log('PASS: sign-in and user identity.')
  const anonymous = publicClient()
  assert.ok((await anonymous.from('school_workspaces').select('*')).error)
  const record = await createWorkspace(clients[0],created[0],'Temporary Schofy QA school')
  record.data.students.push({id:randomUUID(),name:'Temporary fictional learner',status:'Active'})
  assert.equal(await saveWorkspace(clients[0],record.id,record.revision,record.data),1)
  assert.equal((await loadWorkspace(clients[0],created[0])).data.students.length,1)
  console.log('PASS: save and reload.')
  assert.equal(await loadWorkspace(clients[1],created[0]),null)
  await assert.rejects(createWorkspace(clients[1],created[0],'Forbidden owner'),err=>/row-level security/.test(err.message))
  await assert.rejects(saveWorkspace(clients[1],record.id,1,record.data),err=>/changed in another session/.test(err.message))
  await assert.rejects(saveWorkspace(clients[0],record.id,0,record.data),err=>/changed in another session/.test(err.message))
  console.log('PASS: isolation and stale-write rejection.')
  const user = ok(await admin.auth.admin.getUserById(created[0])).user
  const link = ok(await admin.auth.admin.generateLink({type:'recovery',email:user.email,options:{redirectTo:'http://127.0.0.1:5174/workspace?recovery=1'}}))
  assert.equal(new URL(link.properties.action_link).searchParams.get('redirect_to'),'http://127.0.0.1:5174/workspace?recovery=1')
  console.log('PASS: recovery redirect.')
  const recoveryClient = publicClient(); clients.push(recoveryClient)
  ok(await recoveryClient.auth.verifyOtp({token_hash:link.properties.hashed_token,type:'recovery'}))
  console.log('PASS: recovery token.')
  const newPassword = `Recovered-${randomUUID()}!`
  ok(await recoveryClient.auth.updateUser({password:newPassword}))
  ok(await recoveryClient.auth.signOut())
  ok(await recoveryClient.auth.signInWithPassword({email:user.email,password:newPassword}))
  console.log('PASS: live sign-in, identity verification, anonymous denial, save/reload, cross-owner isolation, stale-write rejection, recovery redirect, password recovery and sign-out.')
} finally {
  for(const client of clients) await client.auth.signOut()
  for(const id of created) ok(await admin.auth.admin.deleteUser(id))
  console.log('Temporary verification accounts and their workspaces removed.')
}
