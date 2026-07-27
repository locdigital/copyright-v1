import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from './config/env.js'
import adminAuthRoutes from './routes/adminAuthRoutes.js'
import adminImageRoutes from './routes/adminImageRoutes.js'
import publicImageRoutes from './routes/publicImageRoutes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()

app.use(cors({ origin: env.clientOrigin, credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.get('/api/health', (_request, response) => response.json({ ok: true }))
app.use('/api/images', publicImageRoutes)
app.use('/api/admin/auth', adminAuthRoutes)
app.use('/api/admin', adminImageRoutes)

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(error.status || 500).json({ message: error.message || 'Internal server error.' })
})

if (!process.env.VERCEL) {
  app.listen(env.port, () => {
    console.log(`API server running at http://localhost:${env.port}`)
  })
}

export default app

