import fs from 'node:fs/promises'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { slugify } from '../server/utils/slugify.js'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Supabase Database...')
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'Admin@123456', 12)

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@imagecopyrighthub.test' },
    update: {},
    create: {
      fullName: 'Image Copyright Hub Admin',
      email: 'admin@imagecopyrighthub.test',
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })
  console.log(`Admin user ready: ${admin.email}`)

  let localDb = { categories: [], images: [] }
  try {
    const raw = await fs.readFile('storage/local-db.json', 'utf8')
    localDb = JSON.parse(raw)
  } catch (error) {
    console.warn('Could not read storage/local-db.json, using default seed categories only.')
  }

  const categoryMap = new Map()

  for (const [index, cat] of (localDb.categories || []).entries()) {
    const slug = cat.slug || slugify(cat.name)
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name: cat.name, description: cat.description },
      create: {
        id: cat.id || slug,
        name: cat.name,
        slug,
        description: cat.description || `${cat.name} stock image collection`,
        sortOrder: cat.sortOrder || index + 1,
      },
    })
    categoryMap.set(category.slug, category)
    categoryMap.set(category.id, category)
  }
  console.log(`Seeded ${categoryMap.size} categories.`)

  let insertedImages = 0
  for (const img of localDb.images || []) {
    if (img.deletedAt) continue
    const categorySlug = img.category?.slug || img.categoryId
    let category = categoryMap.get(categorySlug)
    if (!category && img.category?.name) {
      category = await prisma.category.upsert({
        where: { slug: slugify(img.category.name) },
        update: {},
        create: {
          name: img.category.name,
          slug: slugify(img.category.name),
          description: `${img.category.name} stock image collection`,
        },
      })
      categoryMap.set(category.slug, category)
    }

    if (!category) continue

    const keywords = Array.isArray(img.keywords) ? img.keywords.map((k) => (typeof k === 'string' ? k : k.name)) : []

    const image = await prisma.image.upsert({
      where: { slug: img.slug },
      update: {
        title: img.title,
        originalFileUrl: img.originalFileUrl,
        previewFileUrl: img.previewFileUrl || img.originalFileUrl,
        thumbnailUrl: img.thumbnailUrl || img.originalFileUrl,
        watermarkFileUrl: img.watermarkFileUrl || img.originalFileUrl,
        status: img.status || 'PUBLISHED',
      },
      create: {
        id: img.id,
        title: img.title,
        slug: img.slug,
        shortDescription: img.shortDescription || null,
        fullDescription: img.fullDescription || null,
        altText: img.altText || img.title,
        pageTitle: img.pageTitle || img.title,
        metaDescription: img.metaDescription || img.shortDescription || null,
        canonicalUrl: img.canonicalUrl || null,
        originalFileUrl: img.originalFileUrl,
        previewFileUrl: img.previewFileUrl || img.originalFileUrl,
        thumbnailUrl: img.thumbnailUrl || img.originalFileUrl,
        watermarkFileUrl: img.watermarkFileUrl || img.originalFileUrl,
        fileName: img.fileName || `${img.slug}.webp`,
        fileExtension: img.fileExtension || 'webp',
        mimeType: img.mimeType || 'image/webp',
        fileSize: Number(img.fileSize) || 500000,
        width: img.width ? Number(img.width) : null,
        height: img.height ? Number(img.height) : null,
        orientation: img.orientation || null,
        primaryColor: img.primaryColor || null,
        categoryId: category.id,
        uploadedByAdminId: admin.id,
        standardLicensePrice: img.standardLicensePrice ? Number(img.standardLicensePrice) : 19,
        extendedLicensePrice: img.extendedLicensePrice ? Number(img.extendedLicensePrice) : 79,
        currency: img.currency || 'USD',
        copyrightOwner: img.copyrightOwner || 'Image Copyright Hub',
        copyrightNotice: img.copyrightNotice || null,
        trademarkStatus: img.trademarkStatus || 'NO_VISIBLE_TRADEMARK',
        commercialUseAllowed: img.commercialUseAllowed !== false,
        editorialUseOnly: Boolean(img.editorialUseOnly),
        status: img.status || 'PUBLISHED',
        featured: Boolean(img.featured),
        publishedAt: img.publishedAt ? new Date(img.publishedAt) : new Date(),
        keywords: {
          create: keywords.map((name) => ({
            keyword: {
              connectOrCreate: {
                where: { slug: slugify(name) },
                create: { name, slug: slugify(name) },
              },
            },
          })),
        },
      },
    })
    insertedImages++
  }
  console.log(`Seeded ${insertedImages} marketplace images to Supabase!`)
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
