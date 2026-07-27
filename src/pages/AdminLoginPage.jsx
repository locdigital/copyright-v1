import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginAdmin } from '../services/adminApi'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const validate = () => {
    const nextErrors = {}
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Nhập email admin hợp lệ.'
    if (form.password.length < 8) nextErrors.password = 'Mật khẩu tối thiểu 8 ký tự.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submit = async (event) => {
    event.preventDefault()
    setServerError('')
    if (!validate()) return
    setLoading(true)
    try {
      await loginAdmin(form)
      navigate('/admin/images/new')
    } catch (error) {
      setServerError(error.message || 'Thông tin đăng nhập không đúng.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="mb-7 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white"><ShieldCheck size={23} /></span>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">Admin Login</h1>
            <p className="text-sm text-slate-500">Quản trị Image Copyright Hub</p>
          </div>
        </div>
        {serverError && <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{serverError}</div>}
        <form onSubmit={submit} className="grid gap-5">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Email
            <input value={form.email} onChange={(event) => update('email', event.target.value)} className="input" type="email" placeholder="admin@company.com" autoComplete="username" />
            {errors.email && <span className="text-sm font-medium text-red-600">{errors.email}</span>}
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Password
            <div className="relative">
              <input value={form.password} onChange={(event) => update('password', event.target.value)} className="input pr-12" type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Show or hide password">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="text-sm font-medium text-red-600">{errors.password}</span>}
          </label>
          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="flex items-center gap-2 font-medium text-slate-600"><input checked={form.remember} onChange={(event) => update('remember', event.target.checked)} type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600" />Remember me</label>
            <span className="font-medium text-slate-400">Internal access only</span>
          </div>
          <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300">
            <Lock size={18} /> {loading ? 'Đang đăng nhập...' : 'Log In'}
          </button>
        </form>
      </section>
    </main>
  )
}
