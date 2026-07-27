# Admin CMS and Database Setup

This project now includes a modular full-stack admin foundation:

- Frontend admin pages: `/admin/login` and `/admin/images/new`
- Backend API: Node.js + Express under `server/`
- Database schema: PostgreSQL + Prisma under `prisma/schema.prisma`
- Auth: bcrypt password hashing + JWT in secure HTTP-only cookies
- Upload storage: local mock provider under `uploads/`, replaceable with S3 or Cloudinary later

## Local Setup

### Option A: Run immediately with local JSON storage

This is the fastest local mode and does not require PostgreSQL. Uploaded files are saved in `uploads/`, while image metadata is saved in `storage/local-db.json`.

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Keep this value enabled in `.env`:

```env
LOCAL_JSON_DB="true"
```

3. Run the API and frontend:

```bash
npm run dev:api
npm run dev
```

Open `http://localhost:5173/admin/login`, log in, then submit an image from `http://localhost:5173/admin/images/new`.

### Option B: PostgreSQL + Prisma

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Update `.env` with your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/imagecopyrighthub?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
ADMIN_COOKIE_SECURE="false"
```

3. Generate Prisma client and create database tables:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init_admin_cms
npm run db:seed
```

4. Run frontend and API together:

```bash
npm run dev:full
```

## Demo Admin Account

The seed script creates:

- Email: `admin@imagecopyrighthub.test`
- Password: `Admin@123456`
- Role: `SUPER_ADMIN`

The static frontend also supports these credentials in demo mode if the API is not running, saving submitted images to `localStorage` instead of PostgreSQL.

## Important Admin Image Fields

The admin image form supports:

- Image file upload
- Title, short description, full description
- Alt text, page title, meta description, canonical URL
- Category, keywords, orientation, primary color, dimensions
- Standard and extended license prices
- Copyright owner and notice
- Trademark status, trademark name, trademark disclaimer
- Commercial/editorial usage flags
- Model/property release availability
- Draft, review, scheduled, and published statuses
- Published date and scheduled date

## API Endpoints

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`
- `GET /api/admin/categories`
- `POST /api/admin/images`

All admin image routes require an authenticated admin cookie. Image creation is restricted to `SUPER_ADMIN` and `CONTENT_MANAGER` roles.
