import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LayoutDashboard, Newspaper, FolderOpen, Users, Megaphone,
  Mail, LogOut, ExternalLink, Menu, X, Sun, Moon
} from 'lucide-react';
import toast from 'react-hot-toast';
import logoImg from '../../assets/kolhapurtimes24.jpeg';

const LINKS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/news', icon: Newspaper, label: 'Manage News' },
  { to: '/admin/categories', icon: FolderOpen, label: 'Categories' },
  { to: '/admin/authors', icon: Users, label: 'Authors' },
  { to: '/admin/advertisements', icon: Megaphone, label: 'Advertisements' },
  { to: '/admin/subscribers', icon: Mail, label: 'Subscribers' },
];

export default function AdminLayout({ children }) {
  const { signOut, profile } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    toast.success('Signed out');
    navigate('/admin');
  }

  function closeSidebar() { setSidebarOpen(false); }

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-950">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 lg:w-60 bg-white dark:bg-gray-900 shadow-lg flex flex-col z-50 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Mobile close button */}
        <button
          className="absolute top-3 right-3 lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={closeSidebar}
          aria-label="Close menu"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <Link to="/" className="flex items-center gap-2" onClick={closeSidebar}>
            <img src={logoImg} alt="Kolhapur_Times24 Logo" className="w-8 h-8 object-contain rounded-lg" />
            <div>
              <p className="font-black text-gray-900 dark:text-white text-sm leading-none">Kolhapur_Times24</p>
              <p className="text-xs text-gray-400">CMS Admin</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {LINKS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `admin-sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
          <button
            onClick={toggle}
            className="admin-sidebar-link w-full text-left"
          >
            {dark ? <Sun className="w-4 h-4 flex-shrink-0 text-yellow-500" /> : <Moon className="w-4 h-4 flex-shrink-0" />}
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-sidebar-link"
            onClick={closeSidebar}
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            View Site
          </a>
          <button onClick={handleLogout} className="admin-sidebar-link w-full text-left text-red-600 hover:bg-red-50 hover:text-red-700">
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sign Out
          </button>
        </div>

        {/* User info */}
        {profile && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-500 truncate">{profile.email}</p>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">{profile.role}</p>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 lg:hidden flex items-center justify-between px-4 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Kolhapur_Times24 Logo" className="w-7 h-7 object-contain rounded-md" />
              <span className="font-black text-gray-900 dark:text-white text-sm">Kolhapur_Times24 CMS</span>
            </div>
          </div>
          <button
            onClick={toggle}
            className="p-2 -mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
