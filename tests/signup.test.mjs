import test from 'node:test'
import assert from 'node:assert/strict'
import { signupMetadata } from '../src/signupDetails.js'
import { createWorkspace } from '../src/cloudStore.js'

const details={fullName:' Ama Mensah ',jobTitle:'Administrator',schoolName:' Greenfield Academy ',schoolType:'Basic school',schoolSize:'100–499',country:'Ghana',city:'Accra',phone:'+233 24 123 4567'}
test('signup checks password confirmation and required school details',()=>{
  assert.throws(()=>signupMetadata(details,'short','short'),/at least 8/)
  assert.throws(()=>signupMetadata(details,'Strong-pass-123','Other-pass-123'),/do not match/)
  assert.throws(()=>signupMetadata({...details,schoolName:' '},'Strong-pass-123','Strong-pass-123'),/Complete/)
  assert.throws(()=>signupMetadata({...details,schoolType:'Admin'},'Strong-pass-123','Strong-pass-123'),/school type/)
})
test('signup metadata is descriptive and does not contain passwords or privileges',()=>{
  const data=signupMetadata({...details,role:'Super admin',owner_id:'other-owner'},'Strong-pass-123','Strong-pass-123')
  assert.equal(data.full_name,'Ama Mensah')
  assert.equal(data.school_setup.name,'Greenfield Academy')
  assert.equal(data.role,undefined)
  assert.equal(data.owner_id,undefined)
  assert.equal(JSON.stringify(data).includes('Strong-pass-123'),false)
})
test('school creation persists signup details with the authenticated owner',async()=>{
  let payload
  const client={from:()=>({insert:value=>{payload=value;return {select:()=>({single:async()=>({data:{id:'school',...value}})})}}})}
  const profile=signupMetadata(details,'Strong-pass-123','Strong-pass-123')
  await createWorkspace(client,'authenticated-owner','Greenfield Academy',{...profile,email:'owner@example.com',role:'Super admin',owner_id:'forged-owner'})
  assert.equal(payload.owner_id,'authenticated-owner')
  assert.equal(payload.data.settings.type,'Basic school')
  assert.equal(payload.data.settings.country,'Ghana')
  assert.equal(payload.data.settings.studentCount,'100–499')
  assert.equal(payload.data.users[0].id,'authenticated-owner')
  assert.equal(payload.data.users[0].name,'Ama Mensah')
  assert.equal(payload.data.users[0].role,'Admin')
  assert.equal(payload.data.students.length,0)
})
