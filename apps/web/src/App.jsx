import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { AppLayout } from "./components/Layout/AppLayout"
import { LoginPage } from "./pages/LoginPage/LoginPage"
import { DashboardPage } from "./pages/DashboardPage/DashboardPage"
import { UploadBatchPage } from "./pages/UploadBatchPage/UploadBatchPage"
import { BatchDetailPage } from "./pages/BatchDetailPage/BatchDetailPage"
import { DomainDetailPage } from "./pages/DomainDetailPage/DomainDetailPage"
import { ContactsPage } from "./pages/ContactsPage/ContactsPage"
import { ReportsPage } from "./pages/ReportsPage/ReportsPage"
import { SettingsPage } from "./pages/SettingsPage/SettingsPage"
import { getRouterBasename } from "./lib/apiFetch"

const App = () => (
  <AuthProvider>
    <BrowserRouter basename={getRouterBasename()}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/upload" element={<UploadBatchPage />} />
            <Route path="/batches/:batchId" element={<BatchDetailPage />} />
            <Route path="/domains/:domainId" element={<DomainDetailPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)

export default App
