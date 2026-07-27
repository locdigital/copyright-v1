import { Edit, Eye, FileImage, Folder, Layers, LogOut, Plus, RefreshCw, Save, Search, ShieldCheck, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categories as mockCategories } from '../data/mockData'
import { deleteAdminImage, fetchAdminCategories, fetchAdminImages, getStoredAdmin, logoutAdmin, updateAdminImage, updateAdminImageStatus } from '../services/adminApi'

export default function AdminImageListPage() {
  const navigate = useNavigate()
  const admin = getStoredAdmin()

  const [images, setImages] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Edit Modal State
  const [editingImage, setEditingImage] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [newImageFile, setNewImageFile] = useState(null)
  const [filePreview, setFilePreview] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const [imgData, catData] = await Promise.all([
        fetchAdminImages({ search, category: selectedCategory, status: selectedStatus }),
        fetchAdminCategories().catch(() => ({ categories: mockCategories.map((c) => ({ id: c.slug, name: c.name })) })),
      ])
      setImages(imgData?.images || [])
      setCategories(catData?.categories || [])
    } catch (error) {
      if (error.message?.includes('session') || error.message?.includes('authentication') || error.message?.includes('Invalid')) {
        setErrorMessage('Phiên làm việc đã hết hạn. Hệ thống đang chuyển hướng tới trang Đăng nhập...')
        setTimeout(() => navigate('/admin/login'), 1500)
        return
      }
      setErrorMessage(error.message || 'Không thể tải danh sách ảnh.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [search, selectedCategory, selectedStatus])

  const stats = useMemo(() => {
    const total = images.length
    const published = images.filter((img) => img.status === 'PUBLISHED' || img.status === 'APPROVED').length
    const drafts = images.filter((img) => img.status === 'DRAFT' || img.status === 'PENDING_REVIEW').length
    const catCount = categories.length || 8
    return { total, published, drafts, catCount }
  }, [images, categories])

  const handleToggleStatus = async (image) => {
    const nextStatus = image.status === 'PUBLISHED' || image.status === 'APPROVED' ? 'DRAFT' : 'PUBLISHED'
    setActionLoadingId(image.id)
    setMessage('')
    setErrorMessage('')
    try {
      await updateAdminImageStatus(image.id, nextStatus)
      setImages((current) =>
        current.map((item) => (item.id === image.id ? { ...item, status: nextStatus } : item))
      )
      setMessage(`Đã chuyển trạng thái ảnh "${image.title}" sang ${nextStatus === 'PUBLISHED' ? 'PUBLISHED (Hiển thị)' : 'DRAFT (Tạm ẩn)'}.`)
    } catch (error) {
      setErrorMessage(error.message || 'Không thể cập nhật trạng thái.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDelete = async (image) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ảnh "${image.title}" không? Hành động này không thể hoàn tác.`)) {
      return
    }
    setActionLoadingId(image.id)
    setMessage('')
    setErrorMessage('')
    try {
      await deleteAdminImage(image.id)
      setImages((current) => current.filter((item) => item.id !== image.id))
      setMessage(`Đã xóa ảnh "${image.title}" thành công.`)
    } catch (error) {
      setErrorMessage(error.message || 'Không thể xóa ảnh.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Open Edit Modal
  const openEditModal = (image) => {
    setEditingImage(image)
    setNewImageFile(null)
    setFilePreview('')
    const catVal = typeof image.category === 'object' ? (image.category?.id || image.category?.slug) : (image.category || image.categoryId || '')
    setEditForm({
      title: image.title || '',
      shortDescription: image.shortDescription || image.description || '',
      fullDescription: image.fullDescription || image.description || '',
      altText: image.altText || image.title || '',
      categoryId: catVal,
      keywords: Array.isArray(image.keywords) ? image.keywords.join(', ') : (image.keywords || ''),
      standardLicensePrice: image.price || image.standardLicensePrice || 19,
      extendedLicensePrice: image.extendedPrice || image.extendedLicensePrice || 79,
      copyrightOwner: image.copyrightOwner || 'Image Copyright Hub',
      copyrightNotice: image.copyrightNotice || `© ${new Date().getFullYear()} Image Copyright Hub`,
      status: image.status || 'PUBLISHED',
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingImage) return
    setSavingEdit(true)
    setMessage('')
    setErrorMessage('')

    try {
      let payload
      if (newImageFile) {
        payload = new FormData()
        payload.append('image', newImageFile)
        Object.entries(editForm).forEach(([key, val]) => payload.append(key, String(val)))
      } else {
        payload = { ...editForm }
      }

      const result = await updateAdminImage(editingImage.id, payload)
      const updatedImage = {
        ...editingImage,
        ...editForm,
        ...(result.image || {}),
        image: result.image?.image || result.image?.previewFileUrl || editingImage.image || editingImage.previewFileUrl || '/favicon.svg',
        price: Number(editForm.standardLicensePrice || editingImage.price || 19),
        standardLicensePrice: Number(editForm.standardLicensePrice || editingImage.standardLicensePrice || 19),
        extendedPrice: Number(editForm.extendedLicensePrice || editingImage.extendedPrice || 79),
        extendedLicensePrice: Number(editForm.extendedLicensePrice || editingImage.extendedLicensePrice || 79),
      }

      setImages((current) =>
        current.map((item) => (item.id === editingImage.id || item.slug === editingImage.slug ? updatedImage : item))
      )
      setMessage(`Đã cập nhật ảnh "${editForm.title}" thành công!`)
      setEditingImage(null)
    } catch (error) {
      setErrorMessage(error.message || 'Cập nhật ảnh thất bại.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleLogout = async () => {
    await logoutAdmin()
    navigate('/admin/login')
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Admin Header with Tab Navigation */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white">
                <ShieldCheck size={22} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Admin CMS</p>
                <h1 className="font-black text-slate-950">Image Copyright Hub</h1>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden items-center gap-2 sm:flex">
              <Link
                to="/admin/images"
                className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-700 shadow-sm"
              >
                <Layers size={16} /> Danh sách ảnh
              </Link>
              <Link
                to="/admin/images/new"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
              >
                <Plus size={16} /> Upload ảnh mới
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-slate-500 sm:inline">
              {admin?.fullName || 'Admin User'} · {admin?.role || 'SUPER_ADMIN'}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <LogOut size={17} /> Logout
            </button>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="flex border-t border-slate-100 px-4 py-2 sm:hidden">
          <Link
            to="/admin/images"
            className="flex-1 text-center py-2 text-sm font-bold text-blue-600 border-b-2 border-blue-600"
          >
            Danh sách ảnh
          </Link>
          <Link
            to="/admin/images/new"
            className="flex-1 text-center py-2 text-sm font-bold text-slate-500"
          >
            + Upload mới
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Tổng số ảnh</span>
              <FileImage className="text-blue-600" size={20} />
            </div>
            <p className="mt-2 text-3xl font-black text-slate-950">{stats.total}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Đã xuất bản</span>
              <span className="h-3 w-3 rounded-full bg-green-500"></span>
            </div>
            <p className="mt-2 text-3xl font-black text-green-600">{stats.published}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Bản nháp / Tạm ẩn</span>
              <span className="h-3 w-3 rounded-full bg-amber-500"></span>
            </div>
            <p className="mt-2 text-3xl font-black text-amber-600">{stats.drafts}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Danh mục</span>
              <Folder className="text-purple-600" size={20} />
            </div>
            <p className="mt-2 text-3xl font-black text-purple-600">{stats.catCount}</p>
          </div>
        </div>

        {/* Filter & Action Header */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1 sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tiêu đề, từ khóa, ID..."
                className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Tất cả Danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id || c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Tất cả Trạng thái</option>
              <option value="PUBLISHED">Published (Đang mở)</option>
              <option value="DRAFT">Draft (Tạm ẩn)</option>
            </select>

            <button
              onClick={loadData}
              title="Làm mới danh sách"
              className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <Link
            to="/admin/images/new"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-black text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} /> Upload ảnh mới
          </Link>
        </div>

        {/* Message Banner */}
        {message && (
          <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">
            {message}
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Images List Table / Cards */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="py-16 text-center text-sm font-bold text-slate-500">
              Đang tải danh sách hình ảnh...
            </div>
          ) : images.length === 0 ? (
            <div className="py-16 text-center">
              <FileImage className="mx-auto text-slate-300" size={48} />
              <p className="mt-3 text-lg font-bold text-slate-900">Không tìm thấy ảnh nào</p>
              <p className="mt-1 text-sm text-slate-500">
                Thử đổi từ khóa tìm kiếm hoặc upload thêm ảnh mới vào CMS.
              </p>
              <Link
                to="/admin/images/new"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-700"
              >
                <Plus size={16} /> Upload ảnh đầu tiên
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Hình ảnh</th>
                    <th className="px-6 py-4">Tiêu đề & Slug</th>
                    <th className="px-6 py-4">Danh mục</th>
                    <th className="px-6 py-4">Giá bản quyền</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {images.map((img) => {
                    const isPublished = img.status === 'PUBLISHED' || img.status === 'APPROVED'
                    const isActionBusy = actionLoadingId === img.id
                    const displayUrl = img.image || img.previewFileUrl || img.originalFileUrl || '/favicon.svg'

                    return (
                      <tr key={img.id} className="transition hover:bg-slate-50/70">
                        {/* Thumbnail */}
                        <td className="px-6 py-4">
                          <div className="relative h-16 w-20 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                            <img
                              src={displayUrl}
                              alt={img.title}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/favicon.svg'
                              }}
                            />
                          </div>
                        </td>

                        {/* Title & Slug */}
                        <td className="px-6 py-4 max-w-xs">
                          <p className="font-extrabold text-slate-950 line-clamp-1">{img.title}</p>
                          <p className="mt-0.5 text-xs text-slate-400 font-mono truncate">
                            /{img.slug || img.id}
                          </p>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            {typeof img.category === 'object' ? img.category?.name : (img.category || 'General')}
                          </span>
                        </td>

                        {/* Pricing */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">${img.price || img.standardLicensePrice || 19} <span className="text-xs text-slate-400 font-normal">Standard</span></p>
                          <p className="text-xs text-slate-500">${img.extendedPrice || img.extendedLicensePrice || 79} Extended</p>
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          {isPublished ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 border border-green-200">
                              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                              PUBLISHED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                              DRAFT
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* View on Site */}
                            <a
                              href={`/image/${img.slug || img.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Xem ảnh ngoài trang chủ"
                              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye size={16} />
                            </a>

                            {/* Edit Button */}
                            <button
                              onClick={() => openEditModal(img)}
                              title="Chỉnh sửa thông tin ảnh"
                              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Edit size={16} />
                            </button>

                            {/* Toggle Publish / Draft */}
                            <button
                              onClick={() => handleToggleStatus(img)}
                              disabled={isActionBusy}
                              title={isPublished ? 'Chuyển thành Bản nháp' : 'Xuất bản công khai'}
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition border ${
                                isPublished
                                  ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                              }`}
                            >
                              {isPublished ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                              {isPublished ? 'Tạm ẩn' : 'Hiện web'}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(img)}
                              disabled={isActionBusy}
                              title="Xóa ảnh"
                              className="grid h-9 w-9 place-items-center rounded-full border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Image Modal */}
      {editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                  <Edit size={20} />
                </span>
                <div>
                  <h2 className="text-xl font-black text-slate-950">Chỉnh sửa thông tin ảnh</h2>
                  <p className="text-xs font-medium text-slate-500">ID: {editingImage.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingImage(null)}
                className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-6 space-y-6">
              {/* Image Preview & Replacement File */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Hình ảnh hiện tại & Đổi ảnh mới (tùy chọn)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                  <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-200 border border-slate-300">
                    <img
                      src={filePreview || editingImage.image || editingImage.previewFileUrl || '/favicon.svg'}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-sm font-bold text-slate-900">Thay thế file ảnh khác</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chọn file ảnh mới để tự động nén & upload đè lên UploadThing CDN.
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setNewImageFile(file)
                          setFilePreview(URL.createObjectURL(file))
                        }
                      }}
                      className="mt-2 text-xs text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Title & Category */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Tiêu đề ảnh
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Danh mục
                  </label>
                  <select
                    value={editForm.categoryId}
                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 focus:border-blue-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id || c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Short & Full Description */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Mô tả ngắn
                  </label>
                  <input
                    type="text"
                    value={editForm.shortDescription}
                    onChange={(e) => setEditForm({ ...editForm, shortDescription: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Alt Text (SEO)
                  </label>
                  <input
                    type="text"
                    value={editForm.altText}
                    onChange={(e) => setEditForm({ ...editForm, altText: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Full Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Mô tả chi tiết
                </label>
                <textarea
                  rows={3}
                  value={editForm.fullDescription}
                  onChange={(e) => setEditForm({ ...editForm, fullDescription: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Keywords (cách nhau bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={editForm.keywords}
                  onChange={(e) => setEditForm({ ...editForm, keywords: e.target.value })}
                  placeholder="animal, nature, cat, pet"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* License Pricing & Status */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Giá Standard ($)
                  </label>
                  <input
                    type="number"
                    value={editForm.standardLicensePrice}
                    onChange={(e) => setEditForm({ ...editForm, standardLicensePrice: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Giá Extended ($)
                  </label>
                  <input
                    type="number"
                    value={editForm.extendedLicensePrice}
                    onChange={(e) => setEditForm({ ...editForm, extendedLicensePrice: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="PUBLISHED">PUBLISHED (Hiển thị)</option>
                    <option value="DRAFT">DRAFT (Tạm ẩn)</option>
                  </select>
                </div>
              </div>

              {/* Copyright Owner */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Chủ sở hữu Copyright
                  </label>
                  <input
                    type="text"
                    value={editForm.copyrightOwner}
                    onChange={(e) => setEditForm({ ...editForm, copyrightOwner: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Thông báo Bản quyền
                  </label>
                  <input
                    type="text"
                    value={editForm.copyrightNotice}
                    onChange={(e) => setEditForm({ ...editForm, copyrightNotice: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingImage(null)}
                  className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-black text-white hover:bg-blue-700 disabled:bg-blue-300"
                >
                  <Save size={16} />
                  {savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
