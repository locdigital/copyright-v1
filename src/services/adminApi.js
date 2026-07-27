function getApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  if (typeof window !== 'undefined') {
    const isLocal = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
    if (!isLocal) return ''
  }
  return 'http://localhost:4000'
}

const ADMIN_SESSION_KEY = 'imagecopy_admin_session'

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

export function storeAdmin(admin) {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(admin))
}

export function clearStoredAdmin() {
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

async function request(path, options = {}) {
  const controller = new AbortController()
  const timeoutMs = options.body instanceof FormData ? 120000 : 15000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const baseUrl = getApiUrl()
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
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
    storeAdmin(admin)
    return admin
  }

  const data = await request('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, remember }),
  })
  storeAdmin(data.admin)
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
    return { image: saveDemoImage(formData), storage: 'browser preview', staticMode: true }
  }

  return request('/api/admin/images', { method: 'POST', body: formData })
}

export function saveDemoImage(formData) {
  const entries = Object.fromEntries(formData.entries())
  entries.id = `demo-${Date.now()}`
  entries.createdAt = new Date().toISOString()
  entries.imageName = formData.get('image')?.name || 'local-preview-file'
  const current = JSON.parse(localStorage.getItem('imagecopy_demo_admin_images') || '[]')
  localStorage.setItem('imagecopy_demo_admin_images', JSON.stringify([entries, ...current]))
  return entries
}
