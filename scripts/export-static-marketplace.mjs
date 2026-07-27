import fs from 'node:fs/promises'
import { presentImage } from '../server/services/imagePresenter.js'

let images = []
try {
  const raw = await fs.readFile('storage/local-db.json', 'utf8')
  const db = JSON.parse(raw)
  images = (db.images || [])
    .filter((image) => !image.deletedAt && ['APPROVED', 'PUBLISHED'].includes(image.status))
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0))
    .map(presentImage)
} catch (error) {
  console.warn('storage/local-db.json not found during build, creating fallback marketplace-images.json with empty list.')
}

await fs.mkdir('public', { recursive: true })
await fs.writeFile('public/marketplace-images.json', JSON.stringify({ generatedAt: new Date().toISOString(), images }, null, 2))
console.log(`Exported ${images.length} marketplace images to public/marketplace-images.json`)
