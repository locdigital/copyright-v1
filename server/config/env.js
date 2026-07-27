import dotenv from 'dotenv'

dotenv.config()

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-me',
  adminCookieName: process.env.ADMIN_COOKIE_NAME || 'imagecopy_admin_token',
  adminCookieSecure: process.env.ADMIN_COOKIE_SECURE === 'true',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  uploadThingToken: process.env.UPLOADTHING_TOKEN,
  uploadThingSecret: process.env.UPLOADTHING_SECRET,
  localAdminEmail: process.env.LOCAL_ADMIN_EMAIL || 'admin@example.com',
  localAdminPassword: process.env.LOCAL_ADMIN_PASSWORD || 'change-me-in-env',
}
