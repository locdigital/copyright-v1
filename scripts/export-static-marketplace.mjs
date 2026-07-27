import fs from 'node:fs/promises'
import { presentImage } from '../server/services/imagePresenter.js'

const db = JSON.parse(await fs.readFile('storage/local-db.json', 'utf8'))
const images = (db.images || [])
  .filter((image) => !image.deletedAt && ['APPROVED', 'PUBLISHED'].includes(image.status))
  .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0))
  .map(presentImage)

await fs.mkdir('public', { recursive: true })
await fs.writeFile('public/marketplace-images.json', JSON.stringify({ generatedAt: new Date().toISOString(), images }, null, 2))
console.log(`Exported ${images.length} marketplace images to public/marketplace-images.json`)
