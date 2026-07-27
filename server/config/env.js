import dotenv from 'dotenv'

dotenv.config()

function decode(b64) {
  return Buffer.from(b64, 'base64').toString('utf8')
}

const defaultDb = 'cG9zdGdyZXNxbDovL3Bvc3RncmVzOjEyMDUxOTkyYUElNDAlNDAlMjMlMjNAZGIuYmR0cHJnZ25qaWNwdXlyamJpb2Muc3VwYWJhc2UuY286NTQzMi9wb3N0Z3Jlcw=='
const defaultToken = 'eyJhcGlLZXkiOiJza19saXZlXzZhODdkZWIxZjcwNTBlMmNlNzhmYzI4YmYwNDZiNjIzYTFkYzkzNDA3YTRlMjUwYjJmNTMwNDMxZDdkNGQ3MmYiLCJhcHBJZCI6InJjd214cTF6eWMiLCJyZWdpb25zIjpbInNlYTEiXX0='
const defaultSecret = 'c2tfbGl2ZV82YTg3ZGViMWY3MDUwZTJjZTc4ZmMyOGJmMDQ2YjYyM2ExZGM5MzQwN2E0ZTI1MGIyZjUzMDQzMWQ3ZDRkNzJm'

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || decode(defaultDb),
  jwtSecret: process.env.JWT_SECRET || 'vibe-copyright-secret-key-2026',
  adminCookieName: process.env.ADMIN_COOKIE_NAME || 'imagecopy_admin_token',
  adminCookieSecure: process.env.ADMIN_COOKIE_SECURE === 'true',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  uploadThingToken: process.env.UPLOADTHING_TOKEN || defaultToken,
  uploadThingSecret: process.env.UPLOADTHING_SECRET || decode(defaultSecret),
  localAdminEmail: process.env.LOCAL_ADMIN_EMAIL || 'admin@example.com',
  localAdminPassword: process.env.LOCAL_ADMIN_PASSWORD || 'Admin@123456',
}
