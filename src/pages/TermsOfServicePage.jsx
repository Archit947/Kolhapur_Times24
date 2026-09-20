import Layout from '../components/layout/Layout';
import SEOHead from '../components/ui/SEOHead';
import { FileText } from 'lucide-react';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: [
      'By accessing and using the Kolhapur Times 24 website ("Service"), you accept and agree to be bound by these Terms of Service.',
      'If you do not agree to these terms, please do not use our Service.',
      'We reserve the right to modify these terms at any time. Continued use of the Service after any changes constitutes acceptance of the new terms.',
    ],
  },
  {
    title: '2. Use of the Service',
    content: [
      'You may use our Service only for lawful purposes and in accordance with these Terms.',
      'You agree not to use the Service in any way that violates any applicable local, national, or international law or regulation.',
      'You agree not to reproduce, duplicate, copy, or re-sell any part of our Service without our express written permission.',
      'You must not transmit any unsolicited or unauthorized advertising or promotional material or any other form of similar solicitation (spam).',
    ],
  },
  {
    title: '3. Intellectual Property',
    content: [
      'All content published on Kolhapur Times 24 — including text, graphics, logos, images, and audio clips — is the property of Kolhapur Times 24 or its content suppliers and is protected by applicable copyright laws.',
      'You may share links to our articles but may not reproduce or redistribute the full content without prior written permission.',
      'Unauthorized use of our content may give rise to a claim for damages and/or be a criminal offense.',
    ],
  },
  {
    title: '4. User-Generated Content',
    content: [
      'If you submit comments, tips, or other content to us, you grant Kolhapur Times 24 a non-exclusive, royalty-free, worldwide license to use, reproduce, and publish such content.',
      'You represent and warrant that any content you submit does not infringe the rights of any third party and complies with all applicable laws.',
      'We reserve the right to remove any content we deem inappropriate, defamatory, or in violation of these Terms, without prior notice.',
    ],
  },
  {
    title: '5. Disclaimer of Warranties',
    content: [
      'The Service is provided on an "AS IS" and "AS AVAILABLE" basis without any warranties of any kind, either express or implied.',
      'Kolhapur Times 24 does not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.',
      'News content is provided for informational purposes only. We strive for accuracy but do not guarantee the completeness or timeliness of information.',
    ],
  },
  {
    title: '6. Limitation of Liability',
    content: [
      'To the fullest extent permitted by applicable law, Kolhapur Times 24 shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.',
      'We are not responsible for any loss or damage caused by a distributed denial-of-service attack, viruses, or other technologically harmful material that may infect your equipment due to your use of our Service.',
    ],
  },
  {
    title: '7. Third-Party Links',
    content: [
      'Our Service may contain links to third-party websites. These links are provided for your convenience only.',
      'We have no control over the content of those sites and accept no responsibility for them or for any loss or damage that may arise from your use of them.',
    ],
  },
  {
    title: '8. Governing Law',
    content: [
      'These Terms shall be governed by and construed in accordance with the laws of India, specifically the state of Maharashtra, without regard to its conflict of law provisions.',
      'Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Kolhapur, Maharashtra.',
    ],
  },
  {
    title: '9. Contact',
    content: [
      'If you have any questions about these Terms of Service, please contact us:',
      'Kolhapur Times 24 — Kolhapur, Maharashtra, India',
      'Phone: +91 9921410211',
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <Layout sidebar={false}>
      <SEOHead
        title="Terms of Service"
        description="Read the Terms of Service for Kolhapur Times 24 — the rules and guidelines for using our news portal."
      />

      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-red-700" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
              Terms of Service
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Last updated: September 2025
            </p>
          </div>
        </div>

        {/* Intro */}
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-5 mb-8 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Welcome to <strong>Kolhapur Times 24</strong>. These Terms of Service govern your use of
          our website and services. Please read these terms carefully before using our platform.
          By using our Service, you signify your agreement to be bound by these terms.
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
