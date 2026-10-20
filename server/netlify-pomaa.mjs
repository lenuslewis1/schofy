import { Readable } from 'node:stream'

// Adapt Netlify's Web Request/Response API to the existing Node HTTP handler.
export async function servePomaaRequest(request, handler, clientIp = '') {
  const url = new URL(request.url)
  const req = request.body ? Readable.fromWeb(request.body) : Readable.from([])
  req.url = url.pathname + url.search
  req.method = request.method
  req.headers = Object.fromEntries(request.headers)
  req.headers.host ||= url.host
  req.socket = { remoteAddress: clientIp }

  let status = 200
  let headers = {}
  let body = ''
  const res = {
    writeHead(code, responseHeaders = {}) {
      status = code
      headers = responseHeaders
    },
    end(value = '') {
      body = value
    },
  }
  await handler(req, res)
  return new Response(body, { status, headers })
}
