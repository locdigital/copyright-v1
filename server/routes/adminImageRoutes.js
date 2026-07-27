import { Router } from 'express'
import multer from 'multer'
import { requireAdmin, requireAdminRole } from '../middleware/auth.js'
import { prisma } from '../prisma.js'
import { optimizeAndUploadImage } from '../services/uploadThingStorageProvider.js'
import { writeAuditLog } from '../services/auditLogService.js'
import { createLocalImage, deleteLocalImage, getLocalCategories, isLocalJsonDbEnabled, listAllLocalImagesAdmin, localImageSlugExists, updateLocalImageDetails, updateLocalImageStatus } from '../services/localJsonDb.js'
import { presentImage } from '../services/imagePresenter.js'
import { slugify } from '../utils/slugify.js'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!file.mimetype?.startsWith('image/')) {
      callback(new Error('Only image uploads are supported.'))
      return
    }
    callback(null, true)
  },
})

function parseKeywords(value) {
  return String(value || '')
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)
}

function parsePublishedAt(body) {
  if (body.publishedAt) return new Date(body.publishedAt)
  return new Date()
}

function getImageSlug(body, title) {
  const requestedSlug = slugify(body.slug)
  const titleSlug = slugify(title)
  return {
    isCustomSlug: Boolean(requestedSlug),
    slug: requestedSlug || `${titleSlug || 'image'}-${Date.now()}`,
  }
}

router.use(requireAdmin)

router.get('/categories', async (_request, response, next) => {
  try {
    if (isLocalJsonDbEnabled()) {
      const categories = await getLocalCategories()
      response.json({ categories })
      return
    }

    let categories = []
    try {
      categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
    } catch {
      categories = await getLocalCategories()
    }
    response.json({ categories })
  } catch (error) {
    next(error)
  }
})

router.get('/images', async (request, response, next) => {
  try {
    const page = Math.max(Number(request.query.page || 1), 1)
    const limit = Math.min(Math.max(Number(request.query.limit || 50), 1), 100)
    const skip = (page - 1) * limit

    if (isLocalJsonDbEnabled()) {
      const { images, total } = await listAllLocalImagesAdmin({
        category: request.query.category,
        search: request.query.search || request.query.q,
        status: request.query.status,
        skip,
        take: limit,
      })
      response.json({ images: images.map(presentImage), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } })
      return
    }

    const where = { deletedAt: null }
    if (request.query.status) {
      where.status = String(request.query.status).toUpperCase()
    }
    if (request.query.category) {
      const cat = String(request.query.category).trim()
      where.category = { OR: [{ id: cat }, { slug: cat }, { name: { equals: cat, mode: 'insensitive' } }] }
    }
    if (request.query.search || request.query.q) {
      const search = String(request.query.search || request.query.q).trim()
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ]
    }

    try {
      const [images, total] = await Promise.all([
        prisma.image.findMany({
          where,
          include: { category: true, keywords: { include: { keyword: true } } },
          orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: limit,
        }),
        prisma.image.count({ where }),
      ])
      response.json({ images: images.map(presentImage), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } })
    } catch {
      const { images, total } = await listAllLocalImagesAdmin({
        category: request.query.category,
        search: request.query.search || request.query.q,
        status: request.query.status,
        skip,
        take: limit,
      })
      response.json({ images: images.map(presentImage), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } })
    }
  } catch (error) {
    next(error)
  }
})

router.patch('/images/:id/status', requireAdminRole(['SUPER_ADMIN', 'CONTENT_MANAGER']), async (request, response, next) => {
  try {
    const { id } = request.params
    const { status } = request.body
    if (!status) return response.status(400).json({ message: 'Status is required.' })
    const newStatus = String(status).toUpperCase()

    if (isLocalJsonDbEnabled()) {
      const updated = await updateLocalImageStatus(id, newStatus)
      if (!updated) return response.status(404).json({ message: 'Image not found.' })
      response.json({ image: presentImage(updated) })
      return
    }

    try {
      const updated = await prisma.image.update({
        where: { id },
        data: {
          status: newStatus,
          publishedAt: newStatus === 'PUBLISHED' ? new Date() : undefined,
        },
        include: { category: true, keywords: { include: { keyword: true } } },
      })
      response.json({ image: presentImage(updated) })
    } catch {
      const updated = await updateLocalImageStatus(id, newStatus)
      if (!updated) return response.status(404).json({ message: 'Image not found.' })
      response.json({ image: presentImage(updated) })
    }
  } catch (error) {
    next(error)
  }
})

router.delete('/images/:id', requireAdminRole(['SUPER_ADMIN', 'CONTENT_MANAGER']), async (request, response, next) => {
  try {
    const { id } = request.params

    if (isLocalJsonDbEnabled()) {
      await deleteLocalImage(id)
      response.json({ success: true, message: 'Image deleted successfully.' })
      return
    }

    try {
      await prisma.image.update({
        where: { id },
        data: { deletedAt: new Date() },
      })
      response.json({ success: true, message: 'Image deleted successfully.' })
    } catch {
      await deleteLocalImage(id)
      response.json({ success: true, message: 'Image deleted successfully.' })
    }
  } catch (error) {
    next(error)
  }
})

router.put(
  '/images/:id',
  requireAdminRole(['SUPER_ADMIN', 'CONTENT_MANAGER']),
  upload.single('image'),
  async (request, response, next) => {
    try {
      const { id } = request.params
      const body = request.body

      let storedFile = null
      if (request.file) {
        storedFile = await optimizeAndUploadImage(request.file)
      }

      if (isLocalJsonDbEnabled()) {
        const updated = await updateLocalImageDetails(id, body, storedFile)
        if (!updated) return response.status(404).json({ message: 'Image not found.' })
        response.json({ image: presentImage(updated) })
        return
      }

      let categoryId = undefined
      if (body.categoryId) {
        try {
          let dbCategory = await prisma.category.findFirst({
            where: { OR: [{ id: body.categoryId }, { slug: slugify(body.categoryId) }] },
          })
          if (!dbCategory) {
            const categoryName = String(body.categoryId).trim()
            const catSlug = slugify(categoryName) || 'general'
            dbCategory = await prisma.category.upsert({
              where: { slug: catSlug },
              create: { name: categoryName, slug: catSlug },
              update: {},
            })
          }
          categoryId = dbCategory.id
        } catch (catErr) {
          console.warn('Category resolution error on update:', catErr.message)
        }
      }

      const updateData = {
        ...(body.title && { title: String(body.title).trim() }),
        ...(body.shortDescription !== undefined && { shortDescription: body.shortDescription || null }),
        ...(body.fullDescription !== undefined && { fullDescription: body.fullDescription || null }),
        ...(body.altText && { altText: String(body.altText).trim() }),
        ...(body.pageTitle !== undefined && { pageTitle: body.pageTitle || body.title || null }),
        ...(body.metaDescription !== undefined && { metaDescription: body.metaDescription || null }),
        ...(body.standardLicensePrice && { standardLicensePrice: Number(body.standardLicensePrice) }),
        ...(body.extendedLicensePrice && { extendedLicensePrice: Number(body.extendedLicensePrice) }),
        ...(body.copyrightOwner && { copyrightOwner: String(body.copyrightOwner).trim() }),
        ...(body.copyrightNotice !== undefined && { copyrightNotice: body.copyrightNotice || null }),
        ...(body.status && { status: body.status }),
        ...(categoryId && { categoryId }),
        ...(storedFile && storedFile),
      }

      if (body.keywords !== undefined) {
        const rawKeywords = parseKeywords(body.keywords)
        const validKeywords = rawKeywords.filter((name) => Boolean(slugify(name)))
        updateData.keywords = {
          deleteMany: {},
          create: validKeywords.map((name) => ({
            keyword: {
              connectOrCreate: {
                where: { slug: slugify(name) },
                create: { name, slug: slugify(name) },
              },
            },
          })),
        }
      }

      let dbImageId = id
      try {
        const found = await prisma.image.findFirst({
          where: { OR: [{ id }, { slug: id }] },
        })
        if (found) dbImageId = found.id
      } catch (findErr) {
        console.warn('Prisma findFirst error on update:', findErr.message)
      }

      try {
        const updated = await prisma.image.update({
          where: { id: dbImageId },
          data: updateData,
          include: { category: true, keywords: { include: { keyword: true } } },
        })
        response.json({ image: presentImage(updated) })
      } catch (dbErr) {
        console.warn('Prisma image update failed, using local DB fallback:', dbErr.message)
        const updated = await updateLocalImageDetails(id, body, storedFile)
        if (updated) {
          response.json({ image: presentImage(updated) })
          return
        }
        response.json({
          image: presentImage({
            id,
            slug: body.slug || id,
            title: body.title || 'Updated Image',
            ...updateData,
            ...storedFile,
          }),
        })
      }
    } catch (error) {
      next(error)
    }
  },
)

router.post(
  '/images',
  requireAdminRole(['SUPER_ADMIN', 'CONTENT_MANAGER']),
  upload.single('image'),
  async (request, response, next) => {
    try {
      if (!request.file) return response.status(400).json({ message: 'Image file is required.' })

      const body = request.body
      const title = String(body.title || '').trim()
      const altText = String(body.altText || '').trim()
      const copyrightOwner = String(body.copyrightOwner || '').trim()
      if (!title || !altText || !copyrightOwner || !body.categoryId) {
        return response.status(400).json({ message: 'Title, alt text, copyright owner, and category are required.' })
      }

      const { isCustomSlug, slug } = getImageSlug(body, title)
      body.slug = slug

      if (isCustomSlug) {
        if (isLocalJsonDbEnabled()) {
          if (await localImageSlugExists(slug)) return response.status(409).json({ message: 'Slug này đã tồn tại. Vui lòng chọn slug khác.' })
        } else {
          try {
            const existingImage = await prisma.image.findUnique({ where: { slug } })
            if (existingImage) return response.status(409).json({ message: 'Slug này đã tồn tại. Vui lòng chọn slug khác.' })
          } catch {
            // Ignore DB check error, prisma create will handle if duplicate
          }
        }
      }

      const storedFile = await optimizeAndUploadImage(request.file)

      if (isLocalJsonDbEnabled()) {
        const image = await createLocalImage({ body, storedFile, admin: request.admin })
        response.status(201).json({ image, storage: 'local-json-uploadthing' })
        return
      }

      const rawKeywords = parseKeywords(body.keywords)
      const validKeywords = rawKeywords.filter((name) => Boolean(slugify(name)))

      let dbAdminId = null
      try {
        if (request.admin?.id && request.admin.id !== 'demo-admin') {
          const adminCheck = await prisma.admin.findUnique({ where: { id: request.admin.id } })
          if (adminCheck) dbAdminId = adminCheck.id
        }
        if (!dbAdminId) {
          const firstAdmin = await prisma.admin.findFirst({ where: { isActive: true } })
          if (firstAdmin) dbAdminId = firstAdmin.id
        }
      } catch (adminErr) {
        console.warn('Could not fetch DB admin ID:', adminErr.message)
      }

      let categoryId = null
      try {
        let dbCategory = await prisma.category.findFirst({
          where: { OR: [{ id: body.categoryId }, { slug: slugify(body.categoryId) }] },
        })
        if (!dbCategory) {
          const categoryName = String(body.categoryId || 'General').trim()
          const catSlug = slugify(categoryName) || 'general'
          dbCategory = await prisma.category.upsert({
            where: { slug: catSlug },
            create: { name: categoryName, slug: catSlug },
            update: {},
          })
        }
        categoryId = dbCategory.id
      } catch (catErr) {
        console.warn('Could not resolve category ID:', catErr.message)
      }

      try {
        const image = await prisma.image.create({
          data: {
            title,
            slug,
            shortDescription: body.shortDescription || null,
            fullDescription: body.fullDescription || null,
            altText,
            pageTitle: body.pageTitle || title,
            metaDescription: body.metaDescription || body.shortDescription || null,
            canonicalUrl: body.canonicalUrl || null,
            ...storedFile,
            orientation: body.orientation || storedFile.orientation || null,
            primaryColor: body.primaryColor || null,
            categoryId: categoryId || slugify(body.categoryId) || 'general',
            uploadedByAdminId: dbAdminId,
            standardLicensePrice: body.standardLicensePrice ? Number(body.standardLicensePrice) : 19,
            extendedLicensePrice: body.extendedLicensePrice ? Number(body.extendedLicensePrice) : 79,
            currency: body.currency || 'USD',
            copyrightOwner,
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
            publishedAt: parsePublishedAt(body),
            scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
            keywords: validKeywords.length > 0 ? {
              create: validKeywords.map((name) => ({
                keyword: {
                  connectOrCreate: {
                    where: { slug: slugify(name) },
                    create: { name, slug: slugify(name) },
                  },
                },
              })),
            } : undefined,
          },
          include: { category: true, keywords: { include: { keyword: true } } },
        })

        if (dbAdminId) {
          await writeAuditLog({
            adminId: dbAdminId,
            action: 'IMAGE_CREATION',
            entityType: 'Image',
            entityId: image.id,
            newData: image,
            ipAddress: request.ip,
          }).catch(() => {})
        }

        return response.status(201).json({ image: presentImage(image) })
      } catch (createErr) {
        console.error('Prisma image creation failed:', createErr)
        const image = await createLocalImage({ body, storedFile, admin: request.admin })
        return response.status(201).json({ image: presentImage(image), storage: 'fallback-local' })
      }
    } catch (error) {
      next(error)
    }
  },
)

export default router
