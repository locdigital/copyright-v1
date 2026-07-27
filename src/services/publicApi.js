function getApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  if (typeof window !== 'undefined') {
    const isLocal = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
    if (!isLocal) return ''
  }
  return 'http://localhost:4000'
}

let staticMarketplaceCache = null

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
  staticMarketplaceCache = data.images || []
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
    images: filtered.slice(start, start + limit),
    pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) || 1 },
    source: 'static-marketplace',
  }
}

async function fetchStaticImage(id) {
  const images = await getStaticMarketplace()
  const image = images.find((item) => item.id === id || item.slug === id)
  if (!image) throw new Error('Image not found.')
  const similarImages = images.filter((item) => item.id !== image.id && item.category === image.category).slice(0, 4)
  return { image, similarImages, source: 'static-marketplace' }
}

export async function fetchPublicImages(params = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') searchParams.set(key, value)
  })
  const query = searchParams.toString()
  try {
    return await request(`/api/images${query ? `?${query}` : ''}`)
  } catch {
    return fetchStaticImages(params)
  }
}

export async function fetchPublicImage(id) {
  try {
    return await request(`/api/images/${id}`)
  } catch {
    return fetchStaticImage(id)
  }
}
