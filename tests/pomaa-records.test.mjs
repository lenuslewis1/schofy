import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { emptyWorkspace } from '../src/cloudStore.js'
import { allowedPomaaActions, pomaaContext } from '../src/pomaa-context.mjs'
import { applyRecordProposal, isSampleDataRequest, parseRecordProposal, previewRecordProposal, sampleRecordProposal } from '../src/pomaa-records.mjs'
import { createPomaaHandler } from '../server/pomaa.mjs'

const targets = ['classes', 'teachers', 'students']

test('sample records match the school level and save only after review', () => {
  const db = emptyWorkspace()
  db.settings.type = 'Basic school'
  const proposal = sampleRecordProposal(db.settings.type)
  const previews = previewRecordProposal(db, proposal, targets)
  assert.equal(previews.reduce((sum, table) => sum + table.plan.ready, 0), 8)
  assert.equal(db.students.length, 0)
  const saved = applyRecordProposal(db, proposal, targets)
  assert.equal(saved.classes[0].name, 'Grade 4 A')
  assert.equal(saved.students.length, 4)
  assert.equal(saved.teachers.length, 2)
  assert.equal(db.students.length, 0)
  assert.equal(previewRecordProposal(saved, proposal, targets).reduce((sum, table) => sum + table.plan.duplicates, 0), 8)
})

test('record proposals reject unauthorized types, nested values and invalid rows', () => {
  const body = JSON.stringify({ tables: [{ target: 'students', records: [{ name: 'A', group: 'Grade 4' }] }] })
  assert.equal(parseRecordProposal(body, ['students']).tables[0].records[0].name, 'A')
  assert.throws(() => parseRecordProposal(body, ['classes']), /role cannot add/)
  assert.throws(() => parseRecordProposal(JSON.stringify({ tables: [{ target: 'students', records: [{ name: { nested: true } }] }] }), ['students']), /field is not supported/)
  const incomplete = parseRecordProposal(JSON.stringify({ tables: [{ target: 'students', records: [{ name: 'A' }] }] }), ['students'])
  assert.equal(previewRecordProposal(emptyWorkspace(), incomplete, ['students'])[0].plan.invalid, 1)
  assert.throws(() => applyRecordProposal(emptyWorkspace(), incomplete, ['students']), /Correct the flagged/)
})

test('Pomaa action validation restricts record creation to permitted roles', () => {
  const action = { type: 'create_records', label: 'Review records', module: 'overview', body: JSON.stringify(sampleRecordProposal('Basic school')) }
  assert.equal(allowedPomaaActions([action], ['overview', ...targets], 'Admin').length, 1)
  assert.equal(allowedPomaaActions([action], ['overview', ...targets], 'Parent').length, 0)
  assert.equal(allowedPomaaActions([action], ['overview', 'students'], 'Admin').length, 0)
})

test('a dummy-data question returns a reviewable proposal without changing records', async () => {
  assert.equal(isSampleDataRequest('populate with some dum,my data'), true)
  const db = emptyWorkspace()
  db.settings.type = 'Basic school'
  const handler = createPomaaHandler({}, { allowDemo: true, fetchImpl: () => { throw new Error('No AI call needed') } })
  const req = Readable.from([JSON.stringify({ scope: 'demo', context: pomaaContext(db), messages: [{ role: 'user', content: 'populate with some dum,my data' }] })])
  Object.assign(req, { url: '/api/pomaa', method: 'POST', headers: { host: 'localhost' }, socket: { remoteAddress: '127.0.0.1' } })
  let status, result
  await handler(req, { writeHead(code) { status = code }, end(body) { result = JSON.parse(body) } })
  assert.equal(status, 200)
  assert.equal(result.actions[0].type, 'create_records')
  assert.equal(db.students.length, 0)
})

test('AI-proposed real records reach review without writing to the school', async () => {
  const db = emptyWorkspace()
  const proposal = { tables: [{ target: 'students', records: [{ name: 'Ama Mensah', group: 'Form 1 A' }] }] }
  const handler = createPomaaHandler({ OPENAI_API_KEY: 'test-key' }, {
    allowDemo: true,
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body)
      assert.match(body.instructions, /Allowed record schemas:/)
      return new Response(JSON.stringify({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify({ reply: 'Review this learner first.', actions: [{ type: 'create_records', label: 'Review learner', module: 'overview', body: JSON.stringify(proposal) }] }) }] }] }), { status: 200 })
    },
  })
  const req = Readable.from([JSON.stringify({ scope: 'demo', context: pomaaContext(db), messages: [{ role: 'user', content: 'Add Ama Mensah to Form 1 A' }] })])
  Object.assign(req, { url: '/api/pomaa', method: 'POST', headers: { host: 'localhost' }, socket: { remoteAddress: '127.0.0.1' } })
  let result
  await handler(req, { writeHead(code) { assert.equal(code, 200) }, end(body) { result = JSON.parse(body) } })
  assert.equal(result.actions[0].type, 'create_records')
  assert.equal(db.students.length, 0)
})
