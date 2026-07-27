import { Navigate, Route, Routes } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import AdminRoute from './components/AdminRoute'
import Footer from './components/Footer'
import Header from './components/Header'
import ScrollToTop from './components/ScrollToTop'
import AdminImageCreatePage from './pages/AdminImageCreatePage'
import AdminLoginPage from './pages/AdminLoginPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import HomePage from './pages/HomePage'
import ImageDetailsPage from './pages/ImageDetailsPage'
import PricingPage from './pages/PricingPage'
import SearchPage from './pages/SearchPage'
import StaticContentPage from './pages/StaticContentPage'

export default function App() {
  const location = useLocation()
  const isAdminArea = location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <ScrollToTop />
      {!isAdminArea && <Header />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/image/:id" element={<ImageDetailsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<Navigate to="/admin/login" replace />} />
        <Route path="/signup" element={<Navigate to="/admin/login" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/admin/login" replace />} />
        <Route path="/dashboard" element={<Navigate to="/admin/images/new" replace />} />
        <Route path="/contributor" element={<Navigate to="/admin/images/new" replace />} />
        <Route path="/upload" element={<Navigate to="/admin/images/new" replace />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/images/new" element={<AdminRoute><AdminImageCreatePage /></AdminRoute>} />
        <Route path="/:pageSlug" element={<StaticContentPage />} />
      </Routes>
      {!isAdminArea && <Footer />}
    </div>
  )
}
