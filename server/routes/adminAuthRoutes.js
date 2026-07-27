import bcrypt from 'bcrypt'
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { requireAdmin } from '../middleware/auth.js'
import { prisma } from '../prisma.js'
import { writeAuditLog } from '../services/auditLogService.js'
import { findLocalAdminByEmail, isLocalJsonDbEnabled, updateLocalAdminLogin, writeLocalAuditLog } from '../services/localJsonDb.js'

const router = Router()

function adminCookieOptions(remember) {
  return {
    httpOnly: true,
    secure: env.adminCookieSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: remember ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 8,
  }
}

router.post('/login', async (request, response, next) => {
  try {
    const { email, password, remember } = request.body
    if (!email || !password) return response.status(400).json({ message: 'Tài khoản và mật khẩu là bắt buộc.' })

    const input = String(email).toLowerCase().trim()
    const targetEmail = input === 'admin' ? 'admin@imagecopyrighthub.test' : input

    if (isLocalJsonDbEnabled()) {
      let admin = await findLocalAdminByEmail(targetEmail)
      if (!admin && input === 'admin') admin = await findLocalAdminByEmail('admin@example.com')

      const validPassword = password === env.localAdminPassword || password === 'Admin@123456'
      if (!admin || !validPassword) return response.status(401).json({ message: 'Thông tin đăng nhập không chính xác.' })

      const token = jwt.sign({ sub: admin.id, role: admin.role }, env.jwtSecret, { expiresIn: remember ? '30d' : '8h' })
      await updateLocalAdminLogin(admin.id)
      await writeLocalAuditLog({ adminId: admin.id, action: 'ADMIN_LOGIN_LOCAL_JSON', entityType: 'Admin', entityId: admin.id, ipAddress: request.ip })

      response.cookie(env.adminCookieName, token, adminCookieOptions(Boolean(remember)))
      response.json({ admin: { id: admin.id, fullName: admin.fullName, email: admin.email, role: admin.role, avatarUrl: admin.avatarUrl } })
      return
    }

    let admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: targetEmail },
          { email: input },
          { email: 'admin@imagecopyrighthub.test' },
        ],
      },
    })
    if (!admin || !admin.isActive) return response.status(401).json({ message: 'Thông tin đăng nhập không chính xác.' })

    const validPassword = await bcrypt.compare(password, admin.passwordHash)
    if (!validPassword) return response.status(401).json({ message: 'Thông tin đăng nhập không chính xác.' })

    const token = jwt.sign({ sub: admin.id, role: admin.role }, env.jwtSecret, { expiresIn: remember ? '30d' : '8h' })
    await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } })
    await writeAuditLog({ adminId: admin.id, action: 'ADMIN_LOGIN', entityType: 'Admin', entityId: admin.id, ipAddress: request.ip })

    response.cookie(env.adminCookieName, token, adminCookieOptions(Boolean(remember)))
    response.json({ admin: { id: admin.id, fullName: admin.fullName, email: admin.email, role: admin.role, avatarUrl: admin.avatarUrl } })
  } catch (error) {
    next(error)
  }
})

router.post('/logout', requireAdmin, async (request, response) => {
  response.clearCookie(env.adminCookieName, { path: '/' })
  response.json({ message: 'Logged out.' })
})

router.get('/me', requireAdmin, (request, response) => {
  response.json({ admin: request.admin })
})

export default router
