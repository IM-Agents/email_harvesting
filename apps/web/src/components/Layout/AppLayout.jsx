import { NavLink, Outlet } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

const navLinkClass = ({ isActive }) =>
  [
    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-blue-600 text-white"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ")

export const AppLayout = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-blue-600">Email Harvesting</span>
            <span className="hidden text-sm text-slate-500 sm:inline">Contact Discovery</span>
          </div>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Main navigation">
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/upload" className={navLinkClass}>
              Upload
            </NavLink>
            <NavLink to="/contacts" className={navLinkClass}>
              Contacts
            </NavLink>
            <NavLink to="/reports" className={navLinkClass}>
              Reports
            </NavLink>
            {user?.role === "admin" && (
              <NavLink to="/settings" className={navLinkClass}>
                Settings
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{user?.email}</span>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
              aria-label="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
