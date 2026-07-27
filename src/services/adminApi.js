function getApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  if (typeof window !== 'undefined') {
    const isLocal = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
    if (!isLocal) return ''
  }
  return 'http://localhost:4000'
}

const ADMIN_SESSION_KEY = 'imagecopy_admin_session'
const ADMIN_TOKEN_KEY = 'imagecopy_admin_token_str'
const USER_UPLOADED_IMAGES_KEY = 'imagecopy_user_uploaded_images'

function shouldUseStaticAdminPreview() {
  if (typeof window === 'undefined') return false
  return window.location.hostname.endsWith('.surge.sh') || window.location.hostname.endsWith('.github.io')
}

function getStaticAdmin(email) {
  return {
    id: 'static-admin-preview',
    fullName: 'Image Copyright Hub Admin',
    email: String(email).toLowerCase().trim(),
    role: 'STATIC_PREVIEW',
    isStaticPreview: true,
  }
}

export function isStaticAdminMode() {
  const admin = getStoredAdmin()
  return shouldUseStaticAdminPreview() || Boolean(admin?.isStaticPreview)
}

export function getStoredAdmin() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

export function getStoredToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function storeAdmin(admin, token) {
  try {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(admin))
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
  } catch (error) {
    console.warn('Failed to save session to localStorage:', error)
  }
}

export function clearStoredAdmin() {
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY)
    localStorage.removeItem(ADMIN_TOKEN_KEY)
  } catch (error) {
    console.warn('Failed to clear session from localStorage:', error)
  }
}

export function saveUserUploadedImage(image) {
  if (!image) return
  try {
    const existing = JSON.parse(localStorage.getItem(USER_UPLOADED_IMAGES_KEY) || '[]')
    const filtered = existing.filter((item) => item.id !== image.id && item.slug !== image.slug)
    const imgUrl = image.image || image.previewFileUrl || image.originalFileUrl || image.thumbnailUrl || ''
    const formattedImage = {
      ...image,
      image: imgUrl,
      previewFileUrl: image.previewFileUrl || imgUrl,
      originalFileUrl: image.originalFileUrl || imgUrl,
      thumbnailUrl: image.thumbnailUrl || imgUrl,
      category: typeof image.category === 'object' ? image.category?.name : (image.category || 'General'),
      categorySlug: typeof image.category === 'object' ? image.category?.slug : (image.categoryId || 'general'),
      keywords: Array.isArray(image.keywords) ? image.keywords.map((k) => (typeof k === 'object' ? (k.keyword?.name || k.name) : k)) : [],
    }
    localStorage.setItem(USER_UPLOADED_IMAGES_KEY, JSON.stringify([formattedImage, ...filtered]))
  } catch (err) {
    console.warn('Failed to save uploaded image to localStorage:', err)
  }
}

export function getUserUploadedImages() {
  try {
    return JSON.parse(localStorage.getItem(USER_UPLOADED_IMAGES_KEY) || '[]')
  } catch {
    return []
  }
}

async function request(path, options = {}) {
  const controller = new AbortController()
  const timeoutMs = options.body instanceof FormData ? 120000 : 15000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const baseUrl = getApiUrl()
  const token = getStoredToken()

  const headers = options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }
  if (options.headers) Object.assign(headers, options.headers)
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      headers,
      signal: controller.signal,
      ...options,
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || 'Request failed.')
    return data
  } finally {
    clearTimeout(timeout)
  }
}

export async function loginAdmin({ email, password, remember }) {
  if (shouldUseStaticAdminPreview()) {
    const admin = getStaticAdmin(email)
    storeAdmin(admin, 'static-demo-token')
    return admin
  }

  const data = await request('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, remember }),
  })
  storeAdmin(data.admin, data.token)
  return data.admin
}

export async function logoutAdmin() {
  clearStoredAdmin()
  try {
    await request('/api/admin/auth/logout', { method: 'POST' })
  } catch {
    // Static demo mode has no backend API.
  }
}

export async function fetchAdminCategories() {
  if (shouldUseStaticAdminPreview()) throw new Error('Static CMS preview mode.')
  return request('/api/admin/categories')
}

export async function createAdminImage(formData) {
  if (shouldUseStaticAdminPreview()) {
    const demo = saveDemoImage(formData)
    return { image: demo, storage: 'browser preview', staticMode: true }
  }

  const result = await request('/api/admin/images', { method: 'POST', body: formData })
  if (result?.image) {
    saveUserUploadedImage(result.image)
  }
  return result
}

export function saveDemoImage(formData) {
  const entries = Object.fromEntries(formData.entries())
  entries.id = `demo-${Date.now()}`
  entries.createdAt = new Date().toISOString()
  entries.imageName = formData.get('image')?.name || 'local-preview-file'
  const current = JSON.parse(localStorage.getItem('imagecopy_demo_admin_images') || '[]')
  localStorage.setItem('imagecopy_demo_admin_images', JSON.stringify([entries, ...current]))
  saveUserUploadedImage(entries)
  return entries
}
