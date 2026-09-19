import { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import SEOHead from '../../components/ui/SEOHead';
import { useAdminNewsList, useDeleteNews } from '../../hooks/useNews';
import { formatShortDate } from '../../utils/dateFormat';
import { deleteCloudinaryAsset, extractPublicId } from '../../services/cloudinary';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const PAGE_SIZE = 15;

export default function ManageNewsPage() {
  const [page, setPage] = useState(1);
  const { data: result, isLoading } = useAdminNewsList({ limit: PAGE_SIZE, page });
  const deleteNews = useDeleteNews();

  const totalPages = result ? Math.ceil((result.count || 0) / PAGE_SIZE) : 1;

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await deleteNews.mutateAsync(item.id);
      if (item.featured_image) deleteCloudinaryAsset(extractPublicId(item.featured_image));
      toast.success('Article deleted');
    } catch {
      toast.error('Failed to delete article');
    }
  }

  const articles = result?.data || [];

  return (
    <AdminLayout>
      <SEOHead title="Manage News" />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Manage News</h1>
          <p className="text-sm text-gray-500 mt-0.5">{result?.count || 0} total articles</p>
        </div>
        <Link to="/admin/news/create" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Article
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Title</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Author</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Views</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-5 py-3"><div className="skeleton h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : articles.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-white max-w-xs">
                        <span className="line-clamp-1">{item.title}</span>
                        <div className="flex gap-1 mt-0.5">
                          {item.is_featured && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Featured</span>}
                          {item.is_breaking && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Breaking</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{item.categories?.name || '—'}</td>
                      <td className="px-5 py-3 text-gray-500">{item.authors?.name || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          item.status === 'published'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{item.views || 0}</td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatShortDate(item.created_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 justify-center">
                          {item.status === 'published' && (
                            <a href={`/news/${item.slug}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-600 transition-colors" title="View">
                              <Eye className="w-4 h-4" />
                            </a>
                          )}
                          <Link to={`/admin/news/edit/${item.id}`} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleDelete(item)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          {!isLoading && !articles.length && (
            <p className="text-center py-8 text-gray-500 text-sm">No articles yet. <Link to="/admin/news/create" className="text-red-700 font-semibold">Create one</Link></p>
          )}
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              ))
            : articles.map(item => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">{item.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          item.status === 'published'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>{item.status}</span>
                        {item.categories?.name && <span className="text-[11px] text-gray-500">{item.categories.name}</span>}
                        {item.is_featured && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Featured</span>}
                        {item.is_breaking && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Breaking</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{formatShortDate(item.created_at)} · {item.views || 0} views</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 pt-0.5">
                      {item.status === 'published' && (
                        <a href={`/news/${item.slug}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                      <Link to={`/admin/news/edit/${item.id}`} className="text-gray-400 hover:text-blue-600 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(item)} className="text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
          }
          {!isLoading && !articles.length && (
            <p className="text-center py-8 text-gray-500 text-sm">No articles yet. <Link to="/admin/news/create" className="text-red-700 font-semibold">Create one</Link></p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded border border-gray-300 text-sm disabled:opacity-40">← Prev</button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded border border-gray-300 text-sm disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
