import Layout from '../components/layout/Layout';
import SEOHead from '../components/ui/SEOHead';
import { Shield } from 'lucide-react';

const sections = [
  {
    title: '1. Information We Collect',
    content: [
      'We collect information you provide directly to us, such as when you subscribe to our newsletter, submit a news tip, or contact us.',
      'We may automatically collect certain information about your device, including your IP address, browser type, operating system, referring URLs, and pages visited on our site.',
      'We use cookies and similar tracking technologies to track activity on our website and hold certain information to improve and analyze our service.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    content: [
      'To provide, maintain, and improve our news services and content.',
      'To send you newsletters, breaking news alerts, and other communications you have opted into.',
      'To analyze trends, administer the site, and gather demographic information for aggregate use.',
      'To comply with legal obligations and protect the rights and safety of our users.',
    ],
  },
  {
    title: '3. Sharing of Information',
    content: [
      'We do not sell, trade, or rent your personal identification information to third parties.',
      'We may share generic aggregated demographic information — not linked to any personal identification information — with our business partners and advertisers.',
      'We may disclose your information if required by law or in the good-faith belief that such action is necessary to comply with legal process.',
    ],
  },
  {
    title: '4. Cookies',
    content: [
      'Our website uses cookies to enhance the user experience. Cookies are small data files placed on your device that help us remember your preferences.',
      'You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, some parts of our site may not function properly without cookies.',
      'We use both session cookies (which expire once you close your browser) and persistent cookies (which remain on your device for a set period).',
    ],
  },
  {
    title: '5. Third-Party Links',
    content: [
      'Our website may contain links to external websites. We have no control over the content and practices of those sites and accept no responsibility for their respective privacy policies.',
      'We encourage you to review the privacy policy of every site you visit.',
    ],
  },
  {
    title: '6. Data Security',
    content: [
      'We adopt appropriate data collection, storage, and processing practices and security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information.',
      'However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.',
    ],
  },
  {
    title: '7. Changes to This Policy',
    content: [
      'Kolhapur Times 24 has the discretion to update this privacy policy at any time. When we do, we will revise the updated date at the bottom of this page.',
      'We encourage users to frequently check this page for any changes. Continued use of the site after updates constitutes your acknowledgment and acceptance of the revised policy.',
    ],
  },
  {
    title: '8. Contact Us',
    content: [
      'If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please contact us at:',
      'Kolhapur Times 24 — Kolhapur, Maharashtra, India',
      'Phone: +91 9921410211',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <Layout sidebar={false}>
      <SEOHead
        title="Privacy Policy"
        description="Read the Privacy Policy of Kolhapur Times 24 — how we collect, use, and protect your information."
      />

      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-red-700" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
              Privacy Policy
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Last updated: September 2025
            </p>
          </div>
        </div>

        {/* Intro */}
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-5 mb-8 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          This Privacy Policy describes how <strong>Kolhapur Times 24</strong> ("we", "us", or "our")
          collects, uses, and shares information about you when you use our website and services.
          By accessing or using our website, you agree to the collection and use of information in
          accordance with this policy.
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section) => (
            <div
              key={section.title}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            >
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                {section.title}
              </h2>
              <ul className="space-y-2">
                {section.content.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    <span className="text-red-600 mt-0.5 shrink-0">›</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
