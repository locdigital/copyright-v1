import { Router } from 'express'
import { prisma } from '../prisma.js'
import { getLocalImageById, isLocalJsonDbEnabled, listLocalImages } from '../services/localJsonDb.js'
import { presentImage } from '../services/imagePresenter.js'

const router = Router()
const publicStatuses = ['APPROVED', 'PUBLISHED']

function getPagination(query) {
  const page = Math.max(Number(query.page || 1), 1)
  const limit = Math.min(Math.max(Number(query.limit || 24), 1), 60)
  return { page, limit, skip: (page - 1) * limit }
}

function buildWhere(query) {
  const category = String(query.category || '').trim().toLowerCase()
  const search = String(query.search || query.q || '').trim()
  const where = {
    deletedAt: null,
    status: { in: publicStatuses },
  }

  if (category) {
    where.category = { OR: [{ slug: category }, { name: { equals: category, mode: 'insensitive' } }] }
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { shortDescription: { contains: search, mode: 'insensitive' } },
      { fullDescription: { contains: search, mode: 'insensitive' } },
      { altText: { contains: search, mode: 'insensitive' } },
      { category: { name: { contains: search, mode: 'insensitive' } } },
      { keywords: { some: { keyword: { name: { contains: search, mode: 'insensitive' } } } } },
    ]
  }

  return where
}

const imageInclude = {
  category: true,
  uploadedByAdmin: true,
  contributor: { include: { user: true } },
  keywords: { include: { keyword: true } },
}

router.get('/', async (request, response, next) => {
  try {
    const { page, limit, skip } = getPagination(request.query)

    if (isLocalJsonDbEnabled()) {
      const { images, total } = await listLocalImages({
        category: request.query.category,
        search: request.query.search || request.query.q,
        skip,
        take: limit,
      })
      response.json({ images: images.map(presentImage), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } })
      return
    }

    const where = buildWhere(request.query)
    const [images, total] = await Promise.all([
      prisma.image.findMany({ where, include: imageInclude, orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }], skip, take: limit }),
      prisma.image.count({ where }),
    ])

    response.json({ images: images.map(presentImage), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } })
  } catch (error) {
    next(error)
  }
})

router.get('/:identifier', async (request, response, next) => {
  try {
    if (isLocalJsonDbEnabled()) {
      const image = await getLocalImageById(request.params.identifier)
      if (!image) return response.status(404).json({ message: 'Image not found.' })
      const { images } = await listLocalImages({ category: image.category?.slug || image.categoryId, take: 5 })
      response.json({ image: presentImage(image), similarImages: images.filter((item) => item.id !== image.id).slice(0, 4).map(presentImage) })
      return
    }

    const image = await prisma.image.findFirst({ where: { OR: [{ id: request.params.identifier }, { slug: request.params.identifier }], deletedAt: null, status: { in: publicStatuses } }, include: imageInclude })
    if (!image) return response.status(404).json({ message: 'Image not found.' })

    const similarImages = await prisma.image.findMany({
      where: { id: { not: image.id }, categoryId: image.categoryId, deletedAt: null, status: { in: publicStatuses } },
      include: imageInclude,
      orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 4,
    })

    response.json({ image: presentImage(image), similarImages: similarImages.map(presentImage) })
  } catch (error) {
    next(error)
  }
})

export default router
