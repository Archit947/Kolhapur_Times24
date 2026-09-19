import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import SEOHead from '../../components/ui/SEOHead';
import { useAllAds, useCreateAd, useUpdateAd, useDeleteAd } from '../../hooks/useAdvertisements';
import { compressImage } from '../../utils/imageUtils';
import { uploadImage, deleteCloudinaryAsset, extractPublicId } from '../../services/cloudinary';
import { Plus, Pencil, Trash2, X, Check, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const POSITIONS = ['header', 'sidebar', 'footer'];
const EMPTY = { title: '', image: '', url: '', position: 'header', status: 'active' };

export default function ManageAdsPage() {
  const { data: ads = [], isLoading } = useAllAds();
  const createAd = useCreateAd();
  const updateAd = useUpdateAd();
  const deleteAd = useDeleteAd();

  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  function openCreate() { setForm(EMPTY); setEditId(null); setShowForm(true); }
  function openEdit(ad) { setForm({ title: ad.title, image: ad.image || '', url: ad.url || '', position: ad.position, status: ad.status }); setEditId(ad.id); setShowForm(true); }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP or GIF images are allowed');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Image must be under 15MB');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Compressing image…');
    try {
      const compressed = await compressImage(file, { maxWidth: 1200, maxHeight: 800, quality: 0.82, maxSizeKB: 250 });
      toast.loading(`Uploading (${Math.round(compressed.size / 1024)} KB)…`, { id: toastId });
      const { secure_url } = await uploadImage(compressed, { folder: 'ads' });
      setForm(f => ({ ...f, image: secure_url }));
      toast.success(`Image uploaded (${Math.round(compressed.size / 1024)} KB)`, { id: toastId });
    } catch (err) {
      toast.error('Upload failed: ' + (err.message || 'Unknown error'), { id: toastId });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, title: form.title.trim() };
    try {
      if (editId) { await updateAd.mutateAsync({ id: editId, ...payload }); toast.success('Ad updated'); }
      else { await createAd.mutateAsync(payload); toast.success('Ad created'); }
      setShowForm(false); setForm(EMPTY);
    } catch (err) { toast.error(err.message || 'Save failed'); }
  }

  async function handleDelete(ad) {
    if (!window.confirm('Delete this ad?')) return;
    try {
      await deleteAd.mutateAsync(ad.id);
      if (ad.image) deleteCloudinaryAsset(extractPublicId(ad.image));
      toast.success('Deleted');
    }
    catch { toast.error('Delete failed'); }
  }

  const inp = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-red-500';

  return (
    <AdminLayout>
      <SEOHead title="Manage Advertisements" />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Advertisements</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add Ad</button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 mb-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">{editId ? 'Edit' : 'New'} Advertisement</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position</label>
              <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className={inp}>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Image upload section */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ad Image</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Upload button */}
                <div className="relative">
                  <label className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors
                    ${uploading
                      ? 'border-gray-300 bg-gray-50 dark:bg-gray-700 opacity-60 cursor-not-allowed'
                      : 'border-gray-300 dark:border-gray-600 hover:border-red-500 dark:hover:border-red-500 bg-white dark:bg-gray-700'
                    }`}>
                    <Upload className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {uploading ? 'Uploading…' : 'Upload Image'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF · Max 5MB</p>
                </div>
                {/* URL field */}
                <div>
                  <input
                    type="url"
                    value={form.image}
                    onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                    className={inp}
                    placeholder="Or paste image URL directly"
                  />
                </div>
              </div>
              {/* Preview */}
              {form.image && (
                <div className="mt-3 relative inline-block">
                  <img src={form.image} alt="Ad preview" className="h-24 max-w-xs object-contain rounded-lg border border-gray-200 dark:border-gray-600" />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, image: '' }))}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link URL</label>
              <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} className={inp} placeholder="https://example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inp}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={uploading} className="btn-primary flex items-center gap-1 disabled:opacity-60"><Check className="w-4 h-4" /> Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded border border-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1"><X className="w-4 h-4" /> Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Title</th>
                <th className="text-left px-5 py-3">Position</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Preview</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading && <tr><td colSpan={5} className="px-5 py-6 text-center text-gray-500">Loading…</td></tr>}
              {ads.map(ad => (
                <tr key={ad.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{ad.title}</td>
                  <td className="px-5 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">{ad.position}</span></td>
                  <td className="px-5 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${ad.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{ad.status}</span></td>
                  <td className="px-5 py-3">{ad.image && <img src={ad.image} alt={ad.title} className="h-10 w-16 object-cover rounded" />}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3 justify-center">
                      <button onClick={() => openEdit(ad)} className="text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(ad)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {isLoading && <p className="px-4 py-6 text-center text-gray-500 text-sm">Loading…</p>}
          {ads.map(ad => (
            <div key={ad.id} className="p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {ad.image && <img src={ad.image} alt={ad.title} className="w-14 h-10 object-cover rounded flex-shrink-0" />}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{ad.title}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="text-[11px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded capitalize">{ad.position}</span>
                    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${ad.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{ad.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button onClick={() => openEdit(ad)} className="text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(ad)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
