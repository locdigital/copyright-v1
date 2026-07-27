import path from 'node:path'

export function buildStoredFile(file, request) {
  if (!file) return null
  const protocol = request.headers['x-forwarded-proto'] || request.protocol
  const host = request.get('host')
  const publicUrl = `${protocol}://${host}/uploads/${file.filename}`
  return {
    originalFileUrl: publicUrl,
    previewFileUrl: publicUrl,
    thumbnailUrl: publicUrl,
    watermarkFileUrl: publicUrl,
    fileName: file.originalname,
    fileExtension: path.extname(file.originalname).replace('.', '').toLowerCase(),
    mimeType: file.mimetype,
    fileSize: file.size,
  }
}
