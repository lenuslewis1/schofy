import { readFile, mkdir, writeFile } from 'node:fs/promises'

// Emit entry documents for direct links on ordinary static hosts.
const html = await readFile('dist/index.html', 'utf8')
const pages = {
  workspace: ['Workspace', 'Sign in to your private Schofy school management workspace.'],
  login: ['Sign In', 'Sign in to Schofy.'],
  signup: ['Create Account', 'Create your Schofy school owner account.'],
  features: ['Features', 'Explore Schofy student records, attendance, fees, communication and school reporting.'],
  'how-it-works': ['How It Works', 'Discover how Schofy brings your school workspace, people and daily operations together.'],
  'for-schools': ['For Schools', 'A connected school management workspace for administrators, teachers and school leaders.'],
  faq: ['FAQs', 'Find answers about Schofy, the demo workspace and getting started.'],
}
for (const [route, [title, description]] of Object.entries(pages)) {
  await mkdir(`dist/${route}`, { recursive: true })
  await writeFile(`dist/${route}/index.html`, html
    .replace(/<title>.*?<\/title>/, `<title>${title} | Schofy</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${description}" />`))
}
await writeFile('dist/404.html', html.replace(/<title>.*?<\/title>/, '<title>Page Not Found | Schofy</title>'))

