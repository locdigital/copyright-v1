import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { prisma } from '../prisma.js'
import { getLocalAdminById, isLocalJsonDbEnabled } from '../services/localJsonDb.js'

export async function requireAdmin(request, response, next) {
  try {
    const token = request.cookies?.[env.adminCookieName]
    if (!token) return response.status(401).json({ message: 'Admin authentication required.' })

    const payload = jwt.verify(token, env.jwtSecret)
    if (isLocalJsonDbEnabled()) {
      const localAdmin = await getLocalAdminById(payload.sub)
      if (!localAdmin) return response.status(401).json({ message: 'Admin account is inactive or missing.' })
      request.admin = { id: localAdmin.id, fullName: localAdmin.fullName, email: localAdmin.email, role: localAdmin.role, avatarUrl: localAdmin.avatarUrl }
      next()
      return
    }

    const admin = await prisma.admin.findFirst({
      where: { id: payload.sub, isActive: true },
      select: { id: true, fullName: true, email: true, role: true, avatarUrl: true },
    })

    if (!admin) return response.status(401).json({ message: 'Admin account is inactive or missing.' })
    request.admin = admin
    next()
  } catch {
    return response.status(401).json({ message: 'Invalid or expired admin session.' })
  }
}

export function requireAdminRole(roles) {
  return (request, response, next) => {
    if (!request.admin || !roles.includes(request.admin.role)) {
      return response.status(403).json({ message: 'You do not have permission for this admin action.' })
    }
    next()
  }
}
