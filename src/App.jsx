import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { queryClient } from './lib/queryClient';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import HomePage from './pages/HomePage';
import NewsDetailPage from './pages/NewsDetailPage';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import { lazy, Suspense } from 'react';

const SportsCenter = lazy(() => import('./pages/SportsCenter'));

// Admin pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import ManageNewsPage from './pages/admin/ManageNewsPage';
import EditNewsPage from './pages/admin/EditNewsPage';
import ManageCategoriesPage from './pages/admin/ManageCategoriesPage';
import ManageAuthorsPage from './pages/admin/ManageAuthorsPage';
import ManageAdsPage from './pages/admin/ManageAdsPage';
import SubscribersPage from './pages/admin/SubscribersPage';

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 text-center px-4">
      <div className="text-8xl font-black text-red-700 mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Page Not Found</h1>
      <p className="text-gray-500 mb-6">The page you are looking for does not exist.</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public */}
                <Route path="/" element={<HomePage />} />
                <Route path="/news/:slug" element={<NewsDetailPage />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/sports" element={
                  <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
                    <SportsCenter />
                  </Suspense>
                } />

                {/* Admin */}
                <Route path="/admin" element={<AdminLoginPage />} />
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute adminOnly>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/news" element={
                  <ProtectedRoute adminOnly>
                    <ManageNewsPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/news/create" element={
                  <ProtectedRoute adminOnly>
                    <EditNewsPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/news/edit/:id" element={
                  <ProtectedRoute adminOnly>
                    <EditNewsPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/categories" element={
                  <ProtectedRoute adminOnly>
                    <ManageCategoriesPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/authors" element={
                  <ProtectedRoute adminOnly>
                    <ManageAuthorsPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/advertisements" element={
                  <ProtectedRoute adminOnly>
                    <ManageAdsPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/subscribers" element={
                  <ProtectedRoute adminOnly>
                    <SubscribersPage />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<NotFound />} />
              </Routes>

              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3500,
                  style: { borderRadius: '8px', fontSize: '14px' },
                  success: { iconTheme: { primary: '#b91c1c', secondary: 'white' } },
                }}
              />
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

