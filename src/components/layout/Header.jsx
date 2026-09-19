import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Moon, Sun, Menu, X } from 'lucide-react';
import { FaFacebook, FaTwitter, FaYoutube, FaInstagram } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';
import { useCategories } from '../../hooks/useCategories';
import SearchModal from '../ui/SearchModal';
import BreakingTicker from '../ui/BreakingTicker';
import { format } from 'date-fns';
import logoImg from '../../assets/kolhapurtimes24.jpeg';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Politics', path: '/category/politics' },
  { label: 'Business', path: '/category/business' },
  { label: 'Technology', path: '/category/technology' },
  { label: 'Sports', path: '/category/sports' },
  { label: 'Entertainment', path: '/category/entertainment' },
  { label: 'Health', path: '/category/health' },
  { label: 'Education', path: '/category/education' },
  { label: 'Contact', path: '/contact' },
];

export default function Header() {
  const { dark, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: categories = [] } = useCategories();

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <>
      {/* Top bar */}
      <div className="bg-gray-900 text-gray-300 text-xs">
        <div className="container mx-auto px-4 flex items-center justify-between h-8">
          <span>{today}</span>
          <div className="flex items-center gap-3">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-blue-400 transition-colors">
              <FaFacebook size={13} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-sky-400 transition-colors">
              <FaTwitter size={13} />
            </a>
            <a href="https://www.youtube.com/@KOPMAZA" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-red-500 transition-colors">
              <FaYoutube size={13} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-pink-400 transition-colors">
              <FaInstagram size={13} />
            </a>
          </div>
        </div>
      </div>



      {/* Main header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 flex items-center justify-between h-25">
          {/* Logo */}
          <Link to="/" className="mt-4">
            <img src={logoImg} alt="Kolhapur_Times24 Logo" className="w-30 h-20" />
            <div>
              {/* <span className="text-2xl font-black text-red-700 leading-none">KopMaza</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-none">News Portal</p> */}
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {dark
                ? <Sun className="w-5 h-5 text-yellow-400" />
                : <Moon className="w-5 h-5 text-gray-600" />
              }
            </button>
            <button
              className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMobileOpen(m => !m)}
              aria-label="Toggle menu"
            >
              {mobileOpen
                ? <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                : <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              }
            </button>
          </div>
        </div>
      </header>

      {/* Navigation + Breaking Ticker — sticky together */}
      <div className="sticky top-0 z-50">
        <BreakingTicker />
        <nav className="bg-red-700">
          <div className="container mx-auto px-4">
            {/* Desktop nav */}
            <ul className="hidden md:flex items-center gap-0 overflow-x-auto no-scrollbar whitespace-nowrap">
              <li>
                <Link to="/" className="block px-4 py-3 text-white text-sm font-semibold hover:bg-red-800 transition-colors">
                  Home
                </Link>
              </li>
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="block px-4 py-3 text-white text-sm font-semibold hover:bg-red-800 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/contact" className="block px-4 py-3 text-white text-sm font-semibold hover:bg-red-800 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/sports" className="flex items-center gap-1.5 px-4 py-3 text-white text-sm font-bold hover:bg-red-800 transition-colors whitespace-nowrap">
                  🏏 Live Scores
                </Link>
              </li>
            </ul>

            {/* Mobile nav */}
            {mobileOpen && (
              <ul className="md:hidden py-2 border-t border-red-600">
                <li>
                  <Link
                    to="/"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-white text-sm font-medium hover:bg-red-800 transition-colors"
                  >
                    Home
                  </Link>
                </li>
                {categories.map(cat => (
                  <li key={cat.id}>
                    <Link
                      to={`/category/${cat.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-2.5 text-white text-sm font-medium hover:bg-red-800 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/contact"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-white text-sm font-medium hover:bg-red-800 transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    to="/sports"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-white text-sm font-bold hover:bg-red-800 transition-colors"
                  >
                    🏏 Live Scores
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </nav>
      </div>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
