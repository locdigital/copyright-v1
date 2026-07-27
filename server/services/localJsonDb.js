import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { slugify } from '../utils/slugify.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const storageDir = path.join(__dirname, '..', '..', 'storage')
const dataFile = path.join(storageDir, 'local-db.json')

const defaultCategories = ['Nature', 'Business', 'Technology', 'People', 'Travel', 'Food', 'Lifestyle', 'Backgrounds'].map((name, index) => ({
  id: slugify(name),
  name,
  slug: slugify(name),
  description: `${name} stock image collection`,
  thumbnailUrl: null,
  isActive: true,
  sortOrder: index + 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}))

const demoAdmin = {
  id: 'demo-admin',
  fullName: 'Demo Admin',
  email: process.env.LOCAL_ADMIN_EMAIL || 'admin@example.com',
  role: 'SUPER_ADMIN',
  avatarUrl: null,
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

async function ensureDb() {
  await fs.mkdir(storageDir, { recursive: true })
  try {
    const raw = await fs.readFile(dataFile, 'utf8')
    return JSON.parse(raw)
  } catch {
    const initialData = {
      admins: [demoAdmin],
      categories: defaultCategories,
      images: [],
      auditLogs: [],
    }
    await writeDb(initialData)
    return initialData
  }
}

async function writeDb(data) {
  try {
    await fs.mkdir(storageDir, { recursive: true })
    await fs.writeFile(dataFile, JSON.stringify(data, null, 2))
  } catch (error) {
    console.warn('Storage directory read-only on serverless runtime:', error.message)
  }
}

export function isLocalJsonDbEnabled() {
  return process.env.LOCAL_JSON_DB === 'true'
}

export async function findLocalAdminByEmail(email) {
  const db = await ensureDb()
  return db.admins.find((admin) => admin.email === String(email).toLowerCase().trim() && admin.isActive)
}

export async function updateLocalAdminLogin(adminId) {
  const db = await ensureDb()
  const admin = db.admins.find((item) => item.id === adminId)
  if (admin) {
    admin.lastLoginAt = new Date().toISOString()
    admin.updatedAt = new Date().toISOString()
    await writeDb(db)
  }
  return admin
}

export async function getLocalAdminById(adminId) {
  const db = await ensureDb()
  return db.admins.find((admin) => admin.id === adminId && admin.isActive)
}

export async function getLocalCategories() {
  const db = await ensureDb()
  return db.categories.filter((category) => category.isActive).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

export async function writeLocalAuditLog(log) {
  const db = await ensureDb()
  const auditLog = {
    id: `audit-${Date.now()}`,
    adminId: log.adminId || null,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId || null,
    previousData: log.previousData || null,
    newData: log.newData || null,
    ipAddress: log.ipAddress || null,
    createdAt: new Date().toISOString(),
  }
  db.auditLogs.unshift(auditLog)
  await writeDb(db)
  return auditLog
}

export async function localImageSlugExists(slug) {
  const db = await ensureDb()
  return db.images.some((image) => image.slug === slug && !image.deletedAt)
}

export async function createLocalImage({ body, storedFile, admin }) {
  const db = await ensureDb()
  const keywordNames = String(body.keywords || '')
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)

  const image = {
    id: `img-${Date.now()}`,
    title: String(body.title || '').trim(),
    slug: slugify(body.slug) || `${slugify(body.title) || 'image'}-${Date.now()}`,
    shortDescription: body.shortDescription || null,
    fullDescription: body.fullDescription || null,
    altText: String(body.altText || '').trim(),
    pageTitle: body.pageTitle || body.title || null,
    metaDescription: body.metaDescription || body.shortDescription || null,
    canonicalUrl: body.canonicalUrl || null,
    ...storedFile,
    width: body.width ? Number(body.width) : null,
    height: body.height ? Number(body.height) : null,
    orientation: body.orientation || null,
    primaryColor: body.primaryColor || null,
    categoryId: body.categoryId,
    category: db.categories.find((category) => category.id === body.categoryId) || null,
    contributorId: null,
    uploadedByAdminId: admin.id,
    uploadedByAdmin: admin,
    standardLicensePrice: body.standardLicensePrice ? Number(body.standardLicensePrice) : 19,
    extendedLicensePrice: body.extendedLicensePrice ? Number(body.extendedLicensePrice) : 79,
    currency: body.currency || 'USD',
    copyrightOwner: String(body.copyrightOwner || '').trim(),
    copyrightNotice: body.copyrightNotice || null,
    trademarkStatus: body.trademarkStatus || 'NO_VISIBLE_TRADEMARK',
    trademarkName: body.trademarkName || null,
    trademarkDisclaimer: body.trademarkDisclaimer || null,
    commercialUseAllowed: body.commercialUseAllowed !== 'false',
    editorialUseOnly: body.editorialUseOnly === 'true',
    modelReleaseAvailable: body.modelReleaseAvailable === 'true',
    propertyReleaseAvailable: body.propertyReleaseAvailable === 'true',
    status: body.status || 'PUBLISHED',
    featured: body.featured === 'true',
    publishedAt: body.publishedAt || null,
    scheduledAt: body.scheduledAt || null,
    deletedAt: null,
    keywords: keywordNames.map((name) => ({ name, slug: slugify(name) })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  db.images.unshift(image)
  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    adminId: admin.id,
    action: 'IMAGE_CREATION_LOCAL_JSON',
    entityType: 'Image',
    entityId: image.id,
    previousData: null,
    newData: image,
    ipAddress: null,
    createdAt: new Date().toISOString(),
  })
  await writeDb(db)
  return image
}

export async function listLocalImages({ category, search, skip = 0, take = 24 } = {}) {
  const db = await ensureDb()
  const normalizedCategory = String(category || '').toLowerCase().trim()
  const normalizedSearch = String(search || '').toLowerCase().trim()
  const publishedStatuses = new Set(['APPROVED', 'PUBLISHED'])

  const allImages = db.images
    .filter((image) => !image.deletedAt && publishedStatuses.has(image.status))
    .filter((image) => {
      const categorySlug = image.category?.slug || image.categoryId
      const categoryName = image.category?.name || ''
      const matchesCategory = !normalizedCategory || [categorySlug, categoryName].some((value) => String(value).toLowerCase() === normalizedCategory)
      const keywords = Array.isArray(image.keywords) ? image.keywords.map((keyword) => keyword.name || keyword) : []
      const haystack = [image.title, image.shortDescription, image.fullDescription, categoryName, ...keywords].join(' ').toLowerCase()
      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch)
      return matchesCategory && matchesSearch
    })

  return { images: allImages.slice(skip, skip + take), total: allImages.length }
}

export async function getLocalImageById(imageId) {
  const db = await ensureDb()
  const image = db.images.find((item) => (item.id === imageId || item.slug === imageId) && !item.deletedAt && ['APPROVED', 'PUBLISHED'].includes(item.status))
  if (!image) return null
  return image
}

export async function listAllLocalImagesAdmin({ category, search, status, skip = 0, take = 50 } = {}) {
  const db = await ensureDb()
  const normalizedCategory = String(category || '').toLowerCase().trim()
  const normalizedSearch = String(search || '').toLowerCase().trim()
  const normalizedStatus = String(status || '').toUpperCase().trim()

  const allImages = db.images
    .filter((image) => !image.deletedAt)
    .filter((image) => {
      const matchesStatus = !normalizedStatus || image.status === normalizedStatus
      const categorySlug = image.category?.slug || image.categoryId
      const categoryName = image.category?.name || ''
      const matchesCategory = !normalizedCategory || [categorySlug, categoryName].some((value) => String(value).toLowerCase() === normalizedCategory)
      const keywords = Array.isArray(image.keywords) ? image.keywords.map((keyword) => keyword.name || keyword) : []
      const haystack = [image.title, image.shortDescription, image.fullDescription, categoryName, ...keywords].join(' ').toLowerCase()
      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch)
      return matchesStatus && matchesCategory && matchesSearch
    })

  return { images: allImages.slice(skip, skip + take), total: allImages.length }
}

export async function updateLocalImageStatus(id, newStatus) {
  const db = await ensureDb()
  const image = db.images.find((item) => (item.id === id || item.slug === id) && !item.deletedAt)
  if (!image) return null
  image.status = newStatus
  image.updatedAt = new Date().toISOString()
  if (newStatus === 'PUBLISHED' && !image.publishedAt) {
    image.publishedAt = new Date().toISOString()
  }
  await writeDb(db)
  return image
}

export async function deleteLocalImage(id) {
  const db = await ensureDb()
  const imageIndex = db.images.findIndex((item) => (item.id === id || item.slug === id) && !item.deletedAt)
  if (imageIndex === -1) return false
  db.images[imageIndex].deletedAt = new Date().toISOString()
  await writeDb(db)
  return true
}

export async function updateLocalImageDetails(id, body, storedFile = null) {
  const db = await ensureDb()
  const image = db.images.find((item) => (item.id === id || item.slug === id) && !item.deletedAt)
  if (!image) return null

  if (body.title) image.title = String(body.title).trim()
  if (body.shortDescription !== undefined) image.shortDescription = body.shortDescription || null
  if (body.fullDescription !== undefined) image.fullDescription = body.fullDescription || null
  if (body.altText) image.altText = String(body.altText).trim()
  if (body.pageTitle !== undefined) image.pageTitle = body.pageTitle || image.title
  if (body.metaDescription !== undefined) image.metaDescription = body.metaDescription || null
  if (body.canonicalUrl !== undefined) image.canonicalUrl = body.canonicalUrl || null
  if (body.standardLicensePrice) image.standardLicensePrice = Number(body.standardLicensePrice)
  if (body.extendedLicensePrice) image.extendedLicensePrice = Number(body.extendedLicensePrice)
  if (body.copyrightOwner) image.copyrightOwner = String(body.copyrightOwner).trim()
  if (body.copyrightNotice !== undefined) image.copyrightNotice = body.copyrightNotice || null
  if (body.status) image.status = body.status

  if (body.categoryId) {
    image.categoryId = body.categoryId
    image.category = db.categories.find((c) => c.id === body.categoryId || c.slug === body.categoryId) || image.category
  }

  if (body.keywords !== undefined) {
    const keywordNames = String(body.keywords || '').split(',').map((k) => k.trim()).filter(Boolean)
    image.keywords = keywordNames.map((name) => ({ name, slug: slugify(name) }))
  }

  if (storedFile) {
    Object.assign(image, storedFile)
  }

  image.updatedAt = new Date().toISOString()
  await writeDb(db)
  return image
}


