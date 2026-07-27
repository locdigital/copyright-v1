import path from 'node:path'
import sharp from 'sharp'
import { UTApi, UTFile } from 'uploadthing/server'
import { env } from '../config/env.js'
import { slugify } from '../utils/slugify.js'

const MAX_UPLOAD_SIZE = 100 * 1024 * 1024
const MAX_IMAGE_EDGE = 6000
const WEBP_QUALITIES = [88, 82, 76, 68, 60, 52, 44]

function getUploadThingClient() {
  if (!env.uploadThingToken) {
    throw Object.assign(new Error('UPLOADTHING_TOKEN is not configured.'), { status: 500 })
  }
  return new UTApi({ token: env.uploadThingToken, logLevel: 'Error' })
}

function buildOptimizedName(originalName) {
  const parsed = path.parse(originalName || 'image')
  const baseName = slugify(parsed.name || 'image') || 'image'
  return `${Date.now()}-${baseName}.webp`
}

function getOrientation(width, height) {
  if (!width || !height) return null
  if (width === height) return 'Square'
  return width > height ? 'Landscape' : 'Portrait'
}

async function renderWebp(inputBuffer, metadata, quality) {
  const largestEdge = Math.max(metadata.width || 0, metadata.height || 0)
  const resizeOptions = largestEdge > MAX_IMAGE_EDGE ? { width: MAX_IMAGE_EDGE, height: MAX_IMAGE_EDGE, fit: 'inside', withoutEnlargement: true } : null

  let pipeline = sharp(inputBuffer, { animated: false }).rotate()
  if (resizeOptions) pipeline = pipeline.resize(resizeOptions)
  return pipeline.webp({ quality, effort: 5 }).toBuffer({ resolveWithObject: true })
}

export async function optimizeImageBuffer(file) {
  if (!file?.buffer) return null

  const metadata = await sharp(file.buffer).metadata()
  let optimized
  for (const quality of WEBP_QUALITIES) {
    optimized = await renderWebp(file.buffer, metadata, quality)
    if (optimized.data.length <= MAX_UPLOAD_SIZE) break
  }

  if (!optimized || optimized.data.length > MAX_UPLOAD_SIZE) {
    throw Object.assign(new Error('Image is too large after compression. Please upload a smaller source file.'), { status: 413 })
  }

  const info = optimized.info
  return {
    buffer: optimized.data,
    fileName: buildOptimizedName(file.originalname),
    mimeType: 'image/webp',
    fileExtension: 'webp',
    fileSize: optimized.data.length,
    width: info.width || metadata.width || null,
    height: info.height || metadata.height || null,
    orientation: getOrientation(info.width || metadata.width, info.height || metadata.height),
  }
}

export async function optimizeAndUploadImage(file) {
  const optimized = await optimizeImageBuffer(file)
  if (!optimized) return null

  const uploadFile = new UTFile([optimized.buffer], optimized.fileName, { type: optimized.mimeType })
  const result = await getUploadThingClient().uploadFiles(uploadFile)
  if (result?.error || !result?.data) {
    throw Object.assign(new Error(result?.error?.message || 'UploadThing upload failed.'), { status: 502 })
  }

  const publicUrl = result.data.ufsUrl || result.data.url || result.data.appUrl
  return {
    originalFileUrl: publicUrl,
    previewFileUrl: publicUrl,
    thumbnailUrl: publicUrl,
    watermarkFileUrl: publicUrl,
    fileName: optimized.fileName,
    fileExtension: optimized.fileExtension,
    mimeType: optimized.mimeType,
    fileSize: optimized.fileSize,
    width: optimized.width,
    height: optimized.height,
    orientation: optimized.orientation,
  }
}
