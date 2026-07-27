import { getUserUploadedImages } from './adminApi.js'

function getApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  if (typeof window !== 'undefined') {
    const isLocal = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
    if (!isLocal) return ''
  }
  return 'http://localhost:4000'
}

let staticMarketplaceCache = null

function ensureImageUrl(img) {
  if (!img) return img
  const imageUrl = img.image || img.previewFileUrl || img.originalFileUrl || img.thumbnailUrl || ''
  return {
    ...img,
    image: imageUrl,
    previewFileUrl: img.previewFileUrl || imageUrl,
    originalFileUrl: img.originalFileUrl || imageUrl,
    thumbnailUrl: img.thumbnailUrl || imageUrl,
  }
}

async function request(path) {
  const baseUrl = getApiUrl()
  const response = await fetch(`${baseUrl}${path}`)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Request failed.')
  return data
}

async function getStaticMarketplace() {
  if (staticMarketplaceCache) return staticMarketplaceCache
  const response = await fetch('/marketplace-images.json')
  const data = await response.json().catch(() => ({ images: [] }))
  staticMarketplaceCache = (data.images || []).map(ensureImageUrl)
  return staticMarketplaceCache
}

function matchesQuery(image, query) {
  if (!query) return true
  const normalizedQuery = String(query).toLowerCase()
  return [image.title, image.description, image.fullDescription, image.category, ...(image.keywords || [])]
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery)
}

function matchesCategory(image, category) {
  if (!category) return true
  const normalizedCategory = String(category).toLowerCase()
  return [image.category, image.categorySlug].some((value) => String(value || '').toLowerCase() === normalizedCategory)
}

async function fetchStaticImages(params = {}) {
  const page = Math.max(Number(params.page || 1), 1)
  const limit = Math.min(Math.max(Number(params.limit || 24), 1), 60)
  const filtered = (await getStaticMarketplace()).filter((image) => matchesQuery(image, params.q || params.search) && matchesCategory(image, params.category))
  const start = (page - 1) * limit
  return {
    images: filtered.slice(start, start + limit).map(ensureImageUrl),
    pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) || 1 },
    source: 'static-marketplace',
  }
}

async function fetchStaticImage(id) {
  const images = await getStaticMarketplace()
  const rawImage = images.find((item) => item.id === id || item.slug === id)
  if (!rawImage) throw new Error('Image not found.')
  const image = ensureImageUrl(rawImage)
  const similarImages = images.filter((item) => item.id !== image.id && item.category === image.category).slice(0, 4).map(ensureImageUrl)
  return { image, similarImages, source: 'static-marketplace' }
}

export async function fetchPublicImages(params = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') searchParams.set(key, value)
  })
  searchParams.set('_t', Date.now().toString())
  const query = searchParams.toString()

  let apiImages = []
  try {
    const data = await request(`/api/images?${query}`)
    if (Array.isArray(data?.images)) {
      apiImages = data.images.map(ensureImageUrl)
    }
  } catch (error) {
    console.warn('API fetch warning, using static fallback:', error)
  }

  const userLocalImages = getUserUploadedImages().map(ensureImageUrl)
  const staticData = await fetchStaticImages(params)
  const staticImages = (staticData.images || []).map(ensureImageUrl)

  const seenSlugs = new Set()
  const combined = []

  // 1. Highest priority: User uploaded images in current browser session
  for (const img of userLocalImages) {
    const key = img.slug || img.id
    if (key && !seenSlugs.has(key) && matchesQuery(img, params.q || params.search) && matchesCategory(img, params.category)) {
      seenSlugs.add(key)
      combined.push(ensureImageUrl(img))
    }
  }

  // 2. Second priority: Live API images from Supabase
  for (const img of apiImages) {
    const key = img.slug || img.id
    if (key && !seenSlugs.has(key)) {
      seenSlugs.add(key)
      combined.push(ensureImageUrl(img))
    }
  }

  // 3. Third priority: Static seed marketplace images
  for (const img of staticImages) {
    const key = img.slug || img.id
    if (key && !seenSlugs.has(key)) {
      seenSlugs.add(key)
      combined.push(ensureImageUrl(img))
    }
  }

  const page = Math.max(Number(params.page || 1), 1)
  const limit = Math.min(Math.max(Number(params.limit || 24), 1), 60)
  const start = (page - 1) * limit

  return {
    images: combined.slice(start, start + limit),
    pagination: { page, limit, total: combined.length, totalPages: Math.ceil(combined.length / limit) || 1 },
    source: 'multi-source-hybrid',
  }
}

export async function fetchPublicImage(id) {
  const userLocalImages = getUserUploadedImages().map(ensureImageUrl)
  const foundLocal = userLocalImages.find((item) => item.id === id || item.slug === id)
  if (foundLocal) {
    const image = ensureImageUrl(foundLocal)
    const similarImages = userLocalImages.filter((item) => item.id !== image.id).slice(0, 4).map(ensureImageUrl)
    return { image, similarImages, source: 'browser-local' }
  }

  try {
    const data = await request(`/api/images/${id}`)
    if (data?.image) {
      return {
        ...data,
        image: ensureImageUrl(data.image),
        similarImages: Array.isArray(data.similarImages) ? data.similarImages.map(ensureImageUrl) : [],
      }
    }
  } catch (error) {
    console.warn('API fetch single image warning:', error)
  }
  return fetchStaticImage(id)
}
