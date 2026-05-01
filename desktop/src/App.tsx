import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './lib/auth'
import { AdminLayout } from './components/AdminLayout'
import { useDesktopNotifications } from './hooks/useDesktopNotifications'
import { LoginPage } from './pages/Login'
import { DashboardPage } from './pages/Dashboard'
import { ProductsPage } from './pages/Products'
import { CategoriesPage } from './pages/Categories'
import { OrdersPage } from './pages/Orders'
import { PagesPage } from './pages/Pages'
import { PropertiesPage } from './pages/Properties'
import { WebhooksPage } from './pages/Webhooks'
import { ImportExportPage } from './pages/ImportExport'
import { SettingsPage } from './pages/Settings'
import { SeoPage } from './pages/Seo'
import { SectionTypesPage } from './pages/SectionTypes'
import { HomeSectionsPage } from './pages/HomeSections'
import { NavigationPage } from './pages/Navigation'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  useDesktopNotifications() // Polling для уведомлений о заказах
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </ProtectedRoute>
  )
}

function AppRoutes() {
  const navigate = useNavigate()

  // Обработка навигации из Electron (клик по push-уведомлению)
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onNavigate((path: string) => {
        navigate(path)
      })
    }
  }, [navigate])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="section-types" element={<SectionTypesPage />} />
        <Route path="home-sections" element={<HomeSectionsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="pages" element={<PagesPage />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="webhooks" element={<WebhooksPage />} />
        <Route path="import-export" element={<ImportExportPage />} />
        <Route path="seo" element={<SeoPage />} />
        <Route path="navigation" element={<NavigationPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
