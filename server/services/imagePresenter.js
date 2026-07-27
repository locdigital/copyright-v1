function formatDate(value) {
  if (!value) return 'Recently'
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function formatFileSize(bytes) {
  if (!bytes) return 'Unknown'
  const megabytes = Number(bytes) / (1024 * 1024)
  return `${megabytes.toFixed(megabytes >= 10 ? 1 : 2)} MB`
}

function normalizeKeywords(image) {
  if (!Array.isArray(image.keywords)) return []
  return image.keywords
    .map((item) => item.keyword?.name || item.name || item)
    .filter(Boolean)
}

function getContributor(image) {
  if (image.contributor?.user) {
    return {
      id: image.contributor.id,
      name: image.contributor.displayName || image.contributor.user.fullName,
      role: 'Verified Contributor',
      avatar: image.contributor.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(image.contributor.displayName || image.contributor.user.fullName)}&background=2563eb&color=fff`,
    }
  }

  const adminName = image.uploadedByAdmin?.fullName || 'Image Copyright Hub Editorial'
  return {
    id: image.uploadedByAdminId || 'imagecopyrighthub-editorial',
    name: adminName,
    role: 'Curated by Image Copyright Hub',
    avatar: image.uploadedByAdmin?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=0f172a&color=fff`,
  }
}

export function presentImage(image) {
  const categoryName = image.category?.name || 'Uncategorized'
  const categorySlug = image.category?.slug || image.categoryId || 'uncategorized'
  const format = String(image.fileExtension || '').toUpperCase() || 'WEBP'
  const price = Number(image.standardLicensePrice || 19)
  const width = image.width ? Number(image.width) : null
  const height = image.height ? Number(image.height) : null
  const contributor = getContributor(image)

  return {
    id: image.id,
    slug: image.slug,
    title: image.title,
    description: image.shortDescription || image.fullDescription || image.altText,
    fullDescription: image.fullDescription || image.shortDescription || image.altText,
    contributorId: contributor.id,
    contributor,
    category: categoryName,
    categorySlug,
    type: format === 'SVG' ? 'Vector' : 'Photo',
    orientation: image.orientation || 'Landscape',
    color: image.primaryColor || 'Neutral',
    size: image.fileSize && image.fileSize > 20 * 1024 * 1024 ? 'Large' : 'Medium',
    format,
    license: image.editorialUseOnly ? 'Editorial' : 'Standard',
    price,
    extendedPrice: Number(image.extendedLicensePrice || 79),
    currency: image.currency || 'USD',
    dimensions: width && height ? `${width} × ${height} px` : 'High resolution',
    width,
    height,
    aspectRatio: width && height ? width / height : null,
    fileSize: formatFileSize(image.fileSize),
    uploadDate: formatDate(image.publishedAt || image.createdAt),
    licenses: 0,
    keywords: normalizeKeywords(image),
    image: image.previewFileUrl || image.originalFileUrl || image.thumbnailUrl,
    originalFileUrl: image.originalFileUrl,
    previewFileUrl: image.previewFileUrl,
    thumbnailUrl: image.thumbnailUrl,
    altText: image.altText,
    status: image.status,
    copyrightOwner: image.copyrightOwner,
    watermarkText: `${image.copyrightOwner || 'Image Copyright Hub'} · Image Copyright Hub`,
    commercialUseAllowed: image.commercialUseAllowed,
    modelReleaseAvailable: image.modelReleaseAvailable,
    propertyReleaseAvailable: image.propertyReleaseAvailable,
  }
}
