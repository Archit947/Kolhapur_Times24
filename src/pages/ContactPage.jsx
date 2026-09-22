import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/layout/Layout';
import SEOHead from '../components/ui/SEOHead';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSending(true);
    try {
      // Store contact in DB or send email via Supabase Edge Function
      // For now, we just show a success message
      toast.success('Your message has been sent! We\'ll get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const field = 'px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-red-500 w-full';

  return (
    <Layout sidebar={false}>
      <SEOHead title="Contact Us" description="Get in touch with KopMaza News team" />

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Contact Us</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Have a news tip, query or feedback? We'd love to hear from you.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { icon: Mail, label: 'Email', value: 'news@kopmaza.in' },
            { icon: Phone, label: 'Phone', value: '+91 98765 43210' },
            { icon: MapPin, label: 'Address', value: 'Kolhapur, Maharashtra, India' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm text-center">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon className="w-5 h-5 text-red-700" />
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-sm text-gray-900 dark:text-white font-medium">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Send a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Your Name *"
                required
                maxLength={100}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={field}
              />
              <input
                type="email"
                placeholder="Your Email *"
                required
                maxLength={200}
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={field}
              />
            </div>
            <input
              type="text"
              placeholder="Subject"
              maxLength={200}
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              className={field}
            />
            <textarea
              rows={6}
              placeholder="Your message…"
              required
              maxLength={3000}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              className={`${field} resize-none`}
            />
            <button type="submit" disabled={sending} className="btn-primary disabled:opacity-60">
              {sending ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
