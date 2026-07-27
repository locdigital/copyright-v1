import { CalendarDays, FileImage, LogOut, Save, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { categories as mockCategories } from '../data/mockData'
import { createAdminImage, fetchAdminCategories, getStoredAdmin, isStaticAdminMode, logoutAdmin } from '../services/adminApi'

const trademarkOptions = [
  ['NO_VISIBLE_TRADEMARK', 'No Visible Trademark'],
  ['TRADEMARK_VISIBLE', 'Trademark Visible'],
  ['TRADEMARK_PERMISSION_PROVIDED', 'Trademark Permission Provided'],
  ['EDITORIAL_USE_ONLY', 'Editorial Use Only'],
  ['REQUIRES_MANUAL_REVIEW', 'Requires Manual Review'],
]

const initialForm = {
  title: '',
  slug: '',
  shortDescription: '',
  fullDescription: '',
  altText: '',
  pageTitle: '',
  metaDescription: '',
  canonicalUrl: '',
  categoryId: '',
  keywords: '',
  orientation: 'Landscape',
  primaryColor: '',
  width: '',
  height: '',
  standardLicensePrice: '19',
  extendedLicensePrice: '79',
  currency: 'USD',
  copyrightOwner: '',
  copyrightNotice: '',
  trademarkStatus: 'NO_VISIBLE_TRADEMARK',
  trademarkName: '',
  trademarkDisclaimer: '',
  commercialUseAllowed: true,
  editorialUseOnly: false,
  modelReleaseAvailable: false,
  propertyReleaseAvailable: false,
  status: 'PUBLISHED',
  featured: false,
  publishedAt: '',
  scheduledAt: '',
}

function titleCase(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
}

function buildAiContent(title) {
  const cleanTitle = titleCase(title)
  const baseKeywords = cleanTitle.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2)
  const keywords = [...new Set([...baseKeywords, 'stock photo', 'commercial license', 'website image', 'marketing asset', 'digital content'])].slice(0, 10)

  return {
    slug: normalizeSlug(cleanTitle),
    pageTitle: `${cleanTitle} | Royalty-free stock image`,
    altText: `${cleanTitle} stock image for commercial website and marketing use`,
    shortDescription: `${cleanTitle} is a high-quality stock image ready for websites, campaigns, social media, and brand content.`,
    fullDescription: `${cleanTitle} is a polished visual asset designed for modern creative projects. Use it for landing pages, advertisements, editorial layouts, presentations, social content, and digital campaigns that need clean licensed imagery.`,
    metaDescription: `Download ${cleanTitle.toLowerCase()} as a royalty-free stock image for websites, social media, presentations, campaigns, and commercial creative projects.`,
    keywords: keywords.join(', '),
    copyrightOwner: 'Image Copyright Hub',
    copyrightNotice: `© ${new Date().getFullYear()} Image Copyright Hub. All rights reserved.`,
  }
}

function normalizeSlug(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export default function AdminImageCreatePage() {
  const navigate = useNavigate()
  const admin = getStoredAdmin()
  const staticAdminMode = isStaticAdminMode()
  const [form, setForm] = useState(initialForm)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [categories, setCategories] = useState([])
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAdminCategories()
      .then((data) => setCategories(data.categories))
      .catch(() => setCategories(mockCategories.map((category) => ({ id: category.slug, name: category.name }))))
  }, [])

  const keywordTags = useMemo(() => form.keywords.split(',').map((tag) => tag.trim()).filter(Boolean), [form.keywords])
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const updateSlug = (value) => update('slug', normalizeSlug(value))

  const aiFillContent = () => {
    const title = form.title.trim()
    if (!title) {
      setErrors((current) => ({ ...current, title: 'Nhập tiêu đề ảnh trước khi dùng AI fill.' }))
      return
    }

    setForm((current) => ({
      ...current,
      ...buildAiContent(title),
      status: 'PUBLISHED',
      scheduledAt: '',
      featured: false,
      orientation: '',
      primaryColor: '',
      commercialUseAllowed: true,
      editorialUseOnly: false,
      modelReleaseAvailable: false,
      propertyReleaseAvailable: false,
      trademarkStatus: 'NO_VISIBLE_TRADEMARK',
      trademarkName: '',
      trademarkDisclaimer: '',
    }))
    setErrors((current) => ({ ...current, title: undefined, pageTitle: undefined, altText: undefined, shortDescription: undefined, keywords: undefined, copyrightOwner: undefined }))
    setMessage('AI đã tự điền metadata, SEO, keywords và copyright từ tiêu đề ảnh.')
  }

  const onFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const validate = () => {
    const nextErrors = {}
    if (!imageFile) nextErrors.image = 'Chọn file ảnh trước khi lưu.'
    if (!form.title.trim()) nextErrors.title = 'Tiêu đề ảnh là bắt buộc.'
    if (form.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) nextErrors.slug = 'Slug chỉ dùng chữ thường, số và dấu gạch ngang.'
    if (!form.altText.trim()) nextErrors.altText = 'Alt text là bắt buộc cho SEO/accessibility.'
    if (!form.pageTitle.trim()) nextErrors.pageTitle = 'Tiêu đề trang là bắt buộc.'
    if (!form.shortDescription.trim()) nextErrors.shortDescription = 'Mô tả ngắn là bắt buộc.'
    if (!form.categoryId) nextErrors.categoryId = 'Chọn danh mục.'
    if (!form.copyrightOwner.trim()) nextErrors.copyrightOwner = 'Nhập chủ sở hữu copyright.'
    if (keywordTags.length < 3) nextErrors.keywords = 'Nhập tối thiểu 3 keyword, cách nhau bằng dấu phẩy.'
    if (form.trademarkStatus !== 'NO_VISIBLE_TRADEMARK' && !form.trademarkDisclaimer.trim()) nextErrors.trademarkDisclaimer = 'Cần disclaimer khi ảnh có trademark.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submit = async (event) => {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')
    if (!validate()) return
    setLoading(true)

    const formData = new FormData()
    formData.append('image', imageFile)
    Object.entries({
      ...form,
      status: 'PUBLISHED',
      scheduledAt: '',
      featured: false,
      orientation: '',
      primaryColor: '',
      commercialUseAllowed: true,
      editorialUseOnly: false,
      modelReleaseAvailable: false,
      propertyReleaseAvailable: false,
    }).forEach(([key, value]) => formData.append(key, String(value)))

    try {
      const data = await createAdminImage(formData)
      if (data.staticMode) {
        setMessage('Đã mở CMS preview trên Surge. Ảnh chỉ lưu tạm trong trình duyệt; muốn upload UploadThing thật cần deploy backend riêng.')
        setForm(initialForm)
        setImageFile(null)
        setPreview('')
        return
      }
      const storageLabel = data.storage ? ` (${data.storage})` : ''
      setMessage(`Đã nén ảnh, upload lên UploadThing, và lưu vào CMS thành công${storageLabel}.`)
      setForm(initialForm)
      setImageFile(null)
      setPreview('')
    } catch (error) {
      if (error.message?.includes('session') || error.message?.includes('authentication') || error.message?.includes('Invalid')) {
        setErrorMessage('Phiên làm việc đã hết hạn. Hệ thống đang chuyển hướng tới trang Đăng nhập...')
        setTimeout(() => navigate('/admin/login'), 1500)
        return
      }
      setErrorMessage(error.message || 'Upload thất bại. Vui lòng kiểm tra backend, database và UploadThing credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logoutAdmin()
    navigate('/admin/login')
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white"><ShieldCheck size={22} /></span>
            <div>
              <p className="text-sm font-semibold text-blue-600">Admin CMS</p>
              <h1 className="font-black text-slate-950">Image Copyright Hub</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">{admin?.fullName} · {admin?.role}</span>
            <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><LogOut size={17} /> Logout</button>
          </div>
        </div>
      </header>

      {staticAdminMode && (
        <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
            Site deploy static hiện chạy CMS preview. Upload cloud thật cần backend Express đang chạy/deploy và cấu hình `VITE_API_URL`.
          </div>
        </div>
      )}

      <form onSubmit={submit} className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <section className="grid gap-6">
          <Panel title="Upload image" icon={FileImage}>
            <label className="grid min-h-80 cursor-pointer place-items-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50/50">
              <input type="file" accept="image/*" onChange={onFileChange} className="sr-only" />
              {preview ? <img src={preview} alt="Admin upload preview" className="max-h-96 w-full rounded-lg object-cover" /> : <div><FileImage className="mx-auto text-blue-600" size={44} /><p className="mt-4 font-bold text-slate-950">Click để chọn ảnh upload</p><p className="mt-1 text-sm text-slate-500">Ảnh sẽ được nén tự động rồi upload lên UploadThing CDN.</p></div>}
            </label>
            {loading && <p className="mt-3 rounded-2xl bg-blue-50 p-3 text-sm font-bold text-blue-700">Đang nén ảnh và upload lên UploadThing, vui lòng chờ…</p>}
            {errors.image && <p className="mt-2 text-sm font-medium text-red-600">{errors.image}</p>}
          </Panel>

          <Panel title="Content metadata">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Tiêu đề ảnh" error={errors.title}><input className="input" value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Modern business team planning" /></Field>
              <Field label="Custom slug" error={errors.slug}><input className="input" value={form.slug} onChange={(event) => updateSlug(event.target.value)} placeholder="modern-business-team-planning" /></Field>
              <div className="flex items-end">
                <button type="button" onClick={aiFillContent} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-blue-600"><Sparkles size={17} /> AI fill content</button>
              </div>
              <Field label="Tiêu đề trang" error={errors.pageTitle}><input className="input" value={form.pageTitle} onChange={(event) => update('pageTitle', event.target.value)} placeholder="Royalty-free business team image" /></Field>
              <Field label="Alt text" error={errors.altText}><input className="input" value={form.altText} onChange={(event) => update('altText', event.target.value)} placeholder="Creative team reviewing campaign ideas" /></Field>
              <Field label="Canonical URL"><input className="input" value={form.canonicalUrl} onChange={(event) => update('canonicalUrl', event.target.value)} placeholder="https://imagecopyrighthub.surge.sh/image/..." /></Field>
              <Field label="Mô tả ngắn" error={errors.shortDescription}><input className="input" value={form.shortDescription} onChange={(event) => update('shortDescription', event.target.value)} placeholder="Ảnh mô tả ngắn hiển thị ở card/search" /></Field>
              <Field label="Meta description"><input className="input" value={form.metaDescription} onChange={(event) => update('metaDescription', event.target.value)} placeholder="SEO description cho trang ảnh" /></Field>
            </div>
            <Field label="Mô tả đầy đủ"><textarea className="input min-h-36" value={form.fullDescription} onChange={(event) => update('fullDescription', event.target.value)} placeholder="Mô tả chi tiết nội dung, bối cảnh, mục đích sử dụng ảnh..." /></Field>
            <Field label="Keywords" error={errors.keywords}><input className="input" value={form.keywords} onChange={(event) => update('keywords', event.target.value)} placeholder="business, team, meeting, creative" /></Field>
            {keywordTags.length > 0 && <div className="flex flex-wrap gap-2">{keywordTags.map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{tag}</span>)}</div>}
          </Panel>

          <Panel title="Copyright & trademark">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Copyright owner" error={errors.copyrightOwner}><input className="input" value={form.copyrightOwner} onChange={(event) => update('copyrightOwner', event.target.value)} placeholder="Studio / Photographer name" /></Field>
              <Field label="Copyright notice"><input className="input" value={form.copyrightNotice} onChange={(event) => update('copyrightNotice', event.target.value)} placeholder="© 2026 Owner. All rights reserved." /></Field>
              <Field label="Trademark status"><select className="input" value={form.trademarkStatus} onChange={(event) => update('trademarkStatus', event.target.value)}>{trademarkOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label="Trademark name"><input className="input" value={form.trademarkName} onChange={(event) => update('trademarkName', event.target.value)} placeholder="Brand/logo visible if any" /></Field>
            </div>
            <Field label="Trademark disclaimer" error={errors.trademarkDisclaimer}><textarea className="input min-h-28" value={form.trademarkDisclaimer} onChange={(event) => update('trademarkDisclaimer', event.target.value)} placeholder="Ghi chú quyền trademark, editorial-only hoặc bằng chứng permission..." /></Field>
          </Panel>
        </section>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Panel title="Publish settings" icon={CalendarDays}>
            <Field label="Category" error={errors.categoryId}><select className="input" value={form.categoryId} onChange={(event) => update('categoryId', event.target.value)}><option value="">Chọn danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
            <div className="rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">Status mặc định: Published</div>
            <Field label="Ngày đăng / Published at"><input className="input" value={form.publishedAt} onChange={(event) => update('publishedAt', event.target.value)} type="datetime-local" /></Field>
          </Panel>

          <Panel title="License pricing">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Width"><input className="input" value={form.width} onChange={(event) => update('width', event.target.value)} type="number" placeholder="6000" /></Field>
              <Field label="Height"><input className="input" value={form.height} onChange={(event) => update('height', event.target.value)} type="number" placeholder="4000" /></Field>
              <Field label="Standard $"><input className="input" value={form.standardLicensePrice} onChange={(event) => update('standardLicensePrice', event.target.value)} type="number" /></Field>
              <Field label="Extended $"><input className="input" value={form.extendedLicensePrice} onChange={(event) => update('extendedLicensePrice', event.target.value)} type="number" /></Field>
            </div>
          </Panel>

          {message && (
            <div className="rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700 space-y-2">
              <p>{message}</p>
              <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-extrabold text-blue-600 hover:underline">
                Xem ảnh vừa đăng ngay trên Trang Chủ →
              </a>
            </div>
          )}
          {errorMessage && <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{errorMessage}</div>}
          <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-4 font-black text-white shadow-sm transition hover:bg-blue-700 disabled:bg-blue-300"><Save size={19} />{loading ? 'Đang nén & upload...' : 'Lưu ảnh vào CMS'}</button>
        </aside>
      </form>
    </main>
  )
}

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex items-center gap-2 text-xl font-black text-slate-950">{Icon && <Icon className="text-blue-600" size={21} />}{title}</h2>
      <div className="grid gap-5">{children}</div>
    </section>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      {children}
      {error && <span className="text-sm font-medium text-red-600">{error}</span>}
    </label>
  )
}
