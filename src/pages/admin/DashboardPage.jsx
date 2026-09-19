import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import SEOHead from '../../components/ui/SEOHead';
import { Newspaper, FolderOpen, Users, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatShortDate } from '../../utils/dateFormat';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function useStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const [{ count: newsCount }, { count: catCount }, { count: authorCount }, viewsResult] = await Promise.all([
        supabase.from('news').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('authors').select('*', { count: 'exact', head: true }),
        supabase.from('news').select('views').eq('status', 'published'),
      ]);
      const totalViews = (viewsResult.data || []).reduce((sum, n) => sum + (n.views || 0), 0);
      return { newsCount, catCount, authorCount, totalViews };
    },
  });
}

function useRecentNews() {
  return useQuery({
    queryKey: ['admin', 'recent-news'],
    queryFn: async () => {
      const { data } = await supabase
        .from('news')
        .select('id, title, slug, status, views, created_at, categories(name)')
        .order('created_at', { ascending: false })
        .limit(8);
      return data || [];
    },
  });
}

export default function DashboardPage() {
  const { data: stats } = useStats();
  const { data: recent = [] } = useRecentNews();

  return (
    <AdminLayout>
      <SEOHead title="Admin Dashboard" />
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome to Kolhapur_Times24 CMS</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Newspaper} label="Total Articles" value={stats?.newsCount ?? '—'} color="bg-red-700" />
        <StatCard icon={FolderOpen} label="Categories" value={stats?.catCount ?? '—'} color="bg-blue-600" />
        <StatCard icon={Users} label="Authors" value={stats?.authorCount ?? '—'} color="bg-green-600" />
        <StatCard icon={Eye} label="Total Views" value={stats?.totalViews?.toLocaleString() ?? '—'} color="bg-purple-600" />
      </div>

      {/* Recent Articles */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-white">Recent Articles</h2>
          <Link to="/admin/news" className="text-sm text-red-700 font-semibold hover:underline">View All</Link>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Title</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Views</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {recent.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-white max-w-xs truncate">{item.title}</td>
                  <td className="px-5 py-3 text-gray-500">{item.categories?.name || '—'}</td>
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
                  <td className="px-5 py-3 text-gray-500">{formatShortDate(item.created_at)}</td>
                  <td className="px-5 py-3">
                    <Link to={`/admin/news/edit/${item.id}`} className="text-red-700 hover:underline text-xs font-semibold">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recent.length === 0 && (
            <p className="text-center py-8 text-gray-500 text-sm">No articles yet</p>
          )}
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {recent.map(item => (
            <div key={item.id} className="p-4 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">{item.title}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    item.status === 'published'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>{item.status}</span>
                  {item.categories?.name && <span className="text-[11px] text-gray-500">{item.categories.name}</span>}
                </div>
                <p className="text-xs text-gray-400 mt-1">{formatShortDate(item.created_at)} · {item.views || 0} views</p>
              </div>
              <Link to={`/admin/news/edit/${item.id}`} className="text-red-700 hover:underline text-xs font-semibold flex-shrink-0 pt-0.5">Edit</Link>
            </div>
          ))}
          {recent.length === 0 && (
            <p className="text-center py-8 text-gray-500 text-sm">No articles yet</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
