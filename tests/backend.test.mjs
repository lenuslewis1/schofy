import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import {applyImport,columnMapping} from '../src/import-core.mjs'
import { emptyWorkspace, createSaveQueue, saveWorkspace } from '../src/cloudStore.js'

test('school database enforces isolation, ownership and optimistic revisions', async () => {
  const db = new PGlite()
  const owner = '11111111-1111-4111-8111-111111111111'
  const other = '22222222-2222-4222-8222-222222222222'
  try {
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;
      grant usage on schema auth to anon, authenticated;
      insert into auth.users values ('${owner}'), ('${other}');`)
    for(const file of (await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort()) {
      await db.exec(await readFile(`supabase/migrations/${file}`,'utf8'))
    }
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${owner}',false);`)
    const { rows: [row] } = await db.query('insert into public.school_workspaces(owner_id,data) values ($1,$2) returning *', [owner, emptyWorkspace()])
    assert.equal(row.revision, 0)
    await assert.rejects(db.query('insert into public.school_workspaces(owner_id,data) values ($1,$2)', [other,emptyWorkspace()]), /row-level security/)
    const table={file:'fictional.csv',name:'Students',headers:['Student ID','Full name','Class','Phone'],rows:[{row:2,cells:['S1','Test learner','Grade 9','0200123456']},{row:3,cells:['S2','Second test learner','Grade 8','0200987654']}]};const next=applyImport(emptyWorkspace(),table,'students',columnMapping(table.headers,'students'),['students'])
    let result = await db.query('select public.save_school_workspace($1,0,$2) as revision', [row.id,next])
    assert.equal(result.rows[0].revision,1)
    const persisted=(await db.query('select data from public.school_workspaces where id=$1',[row.id])).rows[0].data
    assert.equal(persisted.students.length,2);assert.equal(persisted.students[0].phone,'0200123456');assert.equal(persisted.students[1]._importSource.file,'fictional.csv')
    await assert.rejects(db.query('select public.save_school_workspace($1,0,$2)',[row.id,emptyWorkspace()]), /changed in another session/)
    await assert.rejects(db.query('update public.school_workspaces set owner_id=$1,revision=revision+1 where id=$2',[other,row.id]), /ownership cannot be changed/)
    await assert.rejects(db.query('update public.school_workspaces set data=$1 where id=$2',[emptyWorkspace(),row.id]), /revision must increase/)
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other])
    assert.equal((await db.query('select * from public.school_workspaces')).rows.length,0)
    await assert.rejects(db.query('select public.save_school_workspace($1,1,$2)',[row.id,emptyWorkspace()]), /changed in another session/)
    await db.exec('set role anon')
    await assert.rejects(db.query('select * from public.school_workspaces'), /permission denied/)
    await assert.rejects(db.query('select public.save_school_workspace($1,1,$2)',[row.id,emptyWorkspace()]), /permission denied/)
    await db.exec('reset role')
    assert.equal((await db.query('select data from public.school_workspaces where id=$1',[row.id])).rows[0].data.students[0].name,'Test learner')
  } finally { await db.close() }
})

test('save queue preserves ordering and pauses after a failed write', async () => {
  const saved = [], pending = [], errors = []
  const queue = createSaveQueue(async v=>{if(v===2) throw new Error('network unavailable');saved.push(v)},v=>pending.push(v),e=>errors.push(e.message))
  queue.enqueue(1);queue.enqueue(2);queue.enqueue(3)
  await queue.settled()
  assert.deepEqual(saved,[1])
  assert.deepEqual(errors,['network unavailable'])
  assert.equal(pending.at(-1),0)
  assert.equal(queue.enqueue(4),false)
})

test('server errors and unconfirmed writes cannot be presented as saved', async () => {
  await assert.rejects(saveWorkspace({rpc:async()=>({error:new Error('conflict')})},'id',1,{}),/conflict/)
  await assert.rejects(saveWorkspace({rpc:async()=>({data:null})},'id',1,{}),/did not confirm/)
  assert.equal(await saveWorkspace({rpc:async()=>({data:2})},'id',1,{}),2)
})

test('new accounts start without demo records or another owner’s data', () => {
  const a = emptyWorkspace(), b = emptyWorkspace()
  a.students.push({name:'First school learner'})
  assert.equal(b.students.length,0)
  assert.equal(b.users.length,0)
  assert.equal(b.settings.currency,'GHS')
})
