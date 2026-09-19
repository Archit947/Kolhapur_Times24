import { FaFacebook, FaYoutube, FaInstagram } from 'react-icons/fa';

export default function SocialMediaWidget() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <h3 className="section-title text-base">Follow Our Social Media</h3>
      <div className="flex items-center gap-4 mt-4 justify-center">
        <a
          href="https://www.youtube.com/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YouTube"
          className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
        >
          <FaYoutube size={24} />
        </a>
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
        >
          <FaFacebook size={24} />
        </a>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full hover:bg-pink-100 hover:text-pink-600 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
        >
          <FaInstagram size={24} />
        </a>
      </div>
    </div>
  );
}
