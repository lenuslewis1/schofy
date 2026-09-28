import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createPomaaHandler } from './server/pomaa.mjs'

export default defineConfig(({mode})=>{
  const env={...loadEnv(mode,process.cwd(),''),...process.env}
  return {plugins:[react(),{name:'pomaa-server',configureServer(server){server.middlewares.use(createPomaaHandler(env,{allowDemo:true}))},configurePreviewServer(server){server.middlewares.use(createPomaaHandler(env))}}]}
})
