import fs from 'node:fs/promises'
import path from 'node:path'
import { optimizeAndUploadImage } from '../server/services/uploadThingStorageProvider.js'
import { slugify } from '../server/utils/slugify.js'

const storageFile = 'storage/local-db.json'
const imageDir = 'img'
const siteName = 'Image Copyright Hub'

const catalog = {
  'DSC_1249.JPG': { title: 'Misty Mountain Valley View', category: 'Travel', keywords: ['mountain', 'mist', 'valley', 'travel', 'landscape', 'scenic'], description: 'Atmospheric mountain valley view with misty layers and a quiet scenic mood.' },
  'DSC_1270.JPG': { title: 'Purple Garden Flowers', category: 'Nature', keywords: ['flowers', 'garden', 'purple', 'nature', 'botanical', 'floral'], description: 'Close-up garden flowers with soft purple tones for natural lifestyle visuals.' },
  'DSC_1299.JPG': { title: 'Cat Walking Garden Path', category: 'Animals', keywords: ['cat', 'garden', 'path', 'pet', 'animal', 'outdoor'], description: 'A calm cat walking along a garden path surrounded by greenery.' },
  'DSC_1309.JPG': { title: 'Ginger Cat In Shadow Garden', category: 'Animals', keywords: ['ginger cat', 'cat', 'pet', 'garden', 'animal', 'shade'], description: 'Ginger cat sitting in a shaded garden scene with rich green foliage.' },
  'DSC_1319.JPG': { title: 'Curly Dog On Wooden Porch', category: 'Animals', keywords: ['dog', 'pet', 'porch', 'animal', 'wooden', 'lifestyle'], description: 'Curly dog resting on a rustic wooden porch in a warm outdoor setting.' },
  'DSC_1328.JPG': { title: 'White Cat On Garden Railing', category: 'Animals', keywords: ['white cat', 'cat', 'pet', 'railing', 'garden', 'animal'], description: 'White cat sitting on a garden railing with dark green background contrast.' },
  'DSC_2028.JPG': { title: 'Quiet Workspace Interior', category: 'Lifestyle', keywords: ['workspace', 'interior', 'desk', 'lifestyle', 'minimal', 'work'], description: 'Quiet modern workspace interior with a person working at a desk.' },
  'DSC_2072.JPG': { title: 'Casual Cafe Portrait', category: 'People', keywords: ['portrait', 'cafe', 'person', 'lifestyle', 'urban', 'casual'], description: 'Casual portrait scene captured in a warm cafe environment.' },
  'DSC_2114.JPG': { title: 'Cafe Table Drinks', category: 'Lifestyle', keywords: ['cafe', 'drinks', 'table', 'lifestyle', 'conversation', 'restaurant'], description: 'Cafe table with drinks and a relaxed social atmosphere.' },
  'DSC_2217.JPG': { title: 'Small Bird Nest In Tree', category: 'Nature', keywords: ['bird nest', 'tree', 'nature', 'wildlife', 'branches', 'outdoor'], description: 'Small bird nest hidden among leafy tree branches in natural light.' },
  'DSC_2225.JPG': { title: 'Forest Trail Height Sign', category: 'Travel', keywords: ['forest', 'trail', 'sign', 'hiking', 'travel', 'nature'], description: 'Forest trail sign marking elevation in a lush natural hiking area.' },
  'DSC_2249.JPG': { title: 'Vietnamese Noodle Soup Table', category: 'Food', keywords: ['pho', 'noodle soup', 'vietnamese food', 'restaurant', 'food', 'meal'], description: 'Vietnamese noodle soup served with herbs and sauces on a restaurant table.' },
  'DSC_2263.JPG': { title: 'Relaxed Ginger Cat Indoors', category: 'Animals', keywords: ['ginger cat', 'cat', 'pet', 'indoor', 'animal', 'relaxed'], description: 'Relaxed ginger cat lying indoors with warm natural tones.' },
  'DSC_2296.JPG': { title: 'Window Framed Forest Portrait', category: 'People', keywords: ['portrait', 'window', 'forest', 'creative', 'person', 'lifestyle'], description: 'Creative portrait framed through a window with a lush forest background.' },
  'DSC_2325.JPG': { title: 'Gray Cat Walking Outdoors', category: 'Animals', keywords: ['gray cat', 'cat', 'pet', 'outdoor', 'animal', 'street'], description: 'Gray cat walking outdoors on a warm textured path.' },
}

async function readDb() {
  const raw = await fs.readFile(storageFile, 'utf8')
  return JSON.parse(raw)
}

async function writeDb(db) {
  await fs.writeFile(storageFile, JSON.stringify(db, null, 2))
}

function ensureCategory(db, name) {
  const slug = slugify(name)
  let category = db.categories.find((item) => item.slug === slug)
  if (!category) {
    category = {
      id: slug,
      name,
      slug,
      description: `${name} stock image collection`,
      thumbnailUrl: null,
      isActive: true,
      sortOrder: db.categories.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    db.categories.push(category)
  }
  return category
}

async function fileToUpload(filePath) {
  const buffer = await fs.readFile(filePath)
  return {
    buffer,
    originalname: path.basename(filePath),
    mimetype: 'image/jpeg',
    size: buffer.length,
  }
}

const db = await readDb()
const admin = db.admins?.[0] || { id: 'demo-admin', fullName: 'Demo Admin', role: 'SUPER_ADMIN' }
const files = (await fs.readdir(imageDir)).filter((file) => catalog[file]).sort()
const imported = []
const skipped = []

for (const file of files) {
  const existing = db.images.find((image) => image.fileName?.includes(slugify(path.parse(file).name)) || image.originalSourceFile === file)
  if (existing) {
    skipped.push(file)
    continue
  }

  const meta = catalog[file]
  const category = ensureCategory(db, meta.category)
  const storedFile = await optimizeAndUploadImage(await fileToUpload(path.join(imageDir, file)))
  const now = new Date().toISOString()
  const image = {
    id: `img-${Date.now()}-${slugify(path.parse(file).name)}`,
    title: meta.title,
    slug: `${slugify(meta.title)}-${Date.now()}`,
    shortDescription: meta.description,
    fullDescription: `${meta.description} Curated for commercial websites, editorial layouts, social campaigns, brand presentations, and digital creative projects.`,
    altText: `${meta.title} stock image by ${siteName}`,
    pageTitle: `${meta.title} | Royalty-free stock image`,
    metaDescription: `Download ${meta.title.toLowerCase()} as a royalty-free stock image from ${siteName}.`,
    canonicalUrl: null,
    ...storedFile,
    originalSourceFile: file,
    primaryColor: null,
    categoryId: category.id,
    category,
    contributorId: null,
    uploadedByAdminId: admin.id,
    uploadedByAdmin: admin,
    standardLicensePrice: 19,
    extendedLicensePrice: 79,
    currency: 'USD',
    copyrightOwner: siteName,
    copyrightNotice: `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`,
    trademarkStatus: 'NO_VISIBLE_TRADEMARK',
    trademarkName: null,
    trademarkDisclaimer: null,
    commercialUseAllowed: true,
    editorialUseOnly: false,
    modelReleaseAvailable: false,
    propertyReleaseAvailable: false,
    status: 'PUBLISHED',
    featured: false,
    publishedAt: now,
    scheduledAt: null,
    deletedAt: null,
    keywords: meta.keywords.map((name) => ({ name, slug: slugify(name) })),
    createdAt: now,
    updatedAt: now,
  }

  db.images.unshift(image)
  db.auditLogs.unshift({
    id: `audit-${Date.now()}-${slugify(path.parse(file).name)}`,
    adminId: admin.id,
    action: 'BULK_IMAGE_IMPORT_UPLOADTHING',
    entityType: 'Image',
    entityId: image.id,
    previousData: null,
    newData: { id: image.id, title: image.title, originalSourceFile: file, url: image.originalFileUrl },
    ipAddress: null,
    createdAt: now,
  })
  imported.push({ file, title: image.title, category: category.name, url: image.originalFileUrl })
  await new Promise((resolve) => setTimeout(resolve, 50))
}

await writeDb(db)
console.log(JSON.stringify({ imported: imported.length, skipped: skipped.length, imported, skipped }, null, 2))
