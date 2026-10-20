import { createPomaaHandler } from '../../server/pomaa.mjs'
import { servePomaaRequest } from '../../server/netlify-pomaa.mjs'

const handlers = new Map()

export default async function pomaa(request, context) {
  const origin = new URL(request.url).origin
  const expectedOrigin = Netlify.env.get('APP_ORIGIN') || origin
  if (!handlers.has(expectedOrigin)) handlers.set(expectedOrigin, createPomaaHandler({
    APP_ORIGIN: expectedOrigin,
    OPENAI_API_KEY: Netlify.env.get('OPENAI_API_KEY'),
    OPENAI_MODEL: Netlify.env.get('OPENAI_MODEL'),
    OPENAI_IMPORT_MODEL: Netlify.env.get('OPENAI_IMPORT_MODEL'),
    VITE_SUPABASE_URL: Netlify.env.get('VITE_SUPABASE_URL'),
    VITE_SUPABASE_PUBLISHABLE_KEY: Netlify.env.get('VITE_SUPABASE_PUBLISHABLE_KEY'),
  }))
  return servePomaaRequest(request, handlers.get(expectedOrigin), context.ip)
}

export const config = {
  path: ['/api/pomaa', '/api/pomaa/status', '/api/pomaa/import', '/api/pomaa/document', '/api/pomaa/voice'],
}
