const CONFIGURED_API_URL = import.meta.env.VITE_API_URL || ''
const API_URL = CONFIGURED_API_URL || 'http://localhost:4000'
const ADMIN_SESSION_KEY = 'imagecopy_admin_session'

function isLocalHostname(hostname) {
  return ['localhost', '127.0.0.1', '::1'].includes(hostname)
}

function isLocalApiUrl() {
  try {
    return isLocalHostname(new URL(API_URL).hostname)
  } catch {
    return false
  }
}

function shouldUseStaticAdminPreview() {
  if (typeof window === 'undefined') return false
  return !isLocalHostname(window.location.hostname) && (!CONFIGURED_API_URL || isLocalApiUrl())
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
  const timeoutMs = options.body instanceof FormData ? 120000 : 4000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${API_URL}${path}`, {
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
