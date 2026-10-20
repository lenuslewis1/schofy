import test from 'node:test'
import assert from 'node:assert/strict'
import { createPomaaHandler } from '../server/pomaa.mjs'
import { servePomaaRequest } from '../server/netlify-pomaa.mjs'

test('Netlify adapter exposes Pomaa status as JSON', async () => {
  const handler = createPomaaHandler({ OPENAI_API_KEY: 'test-key', OPENAI_MODEL: 'test-model', APP_ORIGIN: 'https://schofy.netlify.app' })
  const response = await servePomaaRequest(new Request('https://schofy.netlify.app/api/pomaa/status'), handler)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'application/json')
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), { available: true, localDemo: false, model: 'test-model' })
})

test('Netlify adapter keeps live requests protected by session and origin checks', async () => {
  const handler = createPomaaHandler({ OPENAI_API_KEY: 'test-key', APP_ORIGIN: 'https://schofy.netlify.app' })
  const unauthenticated = await servePomaaRequest(new Request('https://schofy.netlify.app/api/pomaa', {
    method: 'POST',
    headers: { Origin: 'https://schofy.netlify.app', 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope: 'live', messages: [{ role: 'user', content: 'Hello' }] }),
  }), handler)
  assert.equal(unauthenticated.status, 401)

  const foreignOrigin = await servePomaaRequest(new Request('https://schofy.netlify.app/api/pomaa/status', {
    headers: { Origin: 'https://other.example' },
  }), handler)
  assert.equal(foreignOrigin.status, 403)
})
