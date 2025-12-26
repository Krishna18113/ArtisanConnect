import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, LogOut, ShoppingCart, MessageSquare, Globe, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { getUnreadMessageCount } from '../services/chatService';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const { data: unreadCountData } = useQuery({
    queryKey: ['unreadMessageCount'],
    queryFn: getUnreadMessageCount,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const unreadCount = unreadCountData?.data?.unreadCount || 0;

  // State for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State for language selector
  const [isTranslateVisible, setIsTranslateVisible] = useState(false);
  const translateRef = useRef(null);

  const toggleTranslate = () => setIsTranslateVisible(prev => !prev);
  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);

  // Close translate dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        translateRef.current &&
        !translateRef.current.contains(event.target) &&
        event.target.id !== 'translate-toggle-button'
      ) {
        setIsTranslateVisible(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Initialize Google Translate
  useEffect(() => {
    if (!window.google || !window.google.translate) {
      const script = document.createElement('script');
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else {
      initializeTranslate();
    }

    window.googleTranslateElementInit = initializeTranslate;

    function initializeTranslate() {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          { pageLanguage: 'en', layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE },
          'google_translate_element'
        );
      }
    }
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/20 backdrop-blur-2xl border-b border-white/30 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="h-20 flex items-center justify-between">

          {/* Brand */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-red-500 rounded-xl flex items-center justify-center shadow-sm">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">
              Artisan Connect
            </span>
          </Link>

          {/* Desktop Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/products"
                className={`text-lg font-medium hover:text-red-500 transition ${isActive('/products') ? 'text-red-600' : 'text-gray-800'}`}
              >
                Products
              </Link>

              {user?.role === 'artisan' ? (
                <>
                  <Link
                    to="/artisan"
                    className={`text-lg font-medium hover:text-red-500 transition ${isActive('/artisan') ? 'text-red-600' : 'text-gray-800'}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/my-products"
                    className={`text-lg font-medium hover:text-red-500 transition ${isActive('/my-products') ? 'text-red-600' : 'text-gray-800'}`}
                  >
                    My Products
                  </Link>
                </>
              ) : (
                <Link
                  to="/orders"
                  className={`text-lg font-medium hover:text-red-500 transition ${isActive('/orders') ? 'text-red-600' : 'text-gray-800'}`}
                >
                  My Orders
                </Link>
              )}

              <Link
                to="/inbox"
                className={`relative text-lg font-medium flex items-center hover:text-red-500 transition ${isActive('/inbox') ? 'text-red-600' : 'text-gray-800'}`}
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Inbox
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </div>
          )}

          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center space-x-2">
            <button onClick={toggleMobileMenu} className="p-2 rounded-md hover:bg-gray-200">
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 text-lg font-medium hover:bg-white/40 px-3 py-2 rounded-xl"
                  >
                    <UserIcon className="w-5 h-5" />
                    <span>{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-200"
                >
                  <div className="px-3 py-2 text-xl">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-gray-lg-500 capitalize">{user.role}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <UserIcon className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-red-600 flex items-center">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={toggleTranslate} id="translate-toggle-button" className="flex items-center cursor-pointer">
                    <Globe className="w-4 h-4 mr-2" />
                    Language
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="space-x-3">
                <Button variant="ghost" size="lg" asChild>
                  <Link to="/login" className="text-lg font-medium">
                    Login
                  </Link>
                </Button>
                <Button size="lg" className="text-lg font-semibold px-6 bg-red-500 hover:bg-red-600">
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>

        </div>

        {/* Mobile Links */}
{isAuthenticated && isMobileMenuOpen && (
  <div className="md:hidden flex flex-col space-y-2 mt-2 px-4 pb-4 border-t border-gray-200 bg-white/80 backdrop-blur-lg rounded-b-xl shadow-md">

    {/* Main navigation */}
    <Link
      to="/products"
      className={`font-medium hover:text-red-500 transition ${isActive('/products') ? 'text-red-600' : 'text-gray-800'}`}
      onClick={() => setIsMobileMenuOpen(false)}
    >
      Products
    </Link>

    {user?.role === 'artisan' ? (
      <>
        <Link
          to="/artisan"
          className={`font-medium hover:text-red-500 transition ${isActive('/artisan') ? 'text-red-600' : 'text-gray-800'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Dashboard
        </Link>
        <Link
          to="/my-products"
          className={`font-medium hover:text-red-500 transition ${isActive('/my-products') ? 'text-red-600' : 'text-gray-800'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          My Products
        </Link>
      </>
    ) : (
      <Link
        to="/orders"
        className={`font-medium hover:text-red-500 transition ${isActive('/orders') ? 'text-red-600' : 'text-gray-800'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        My Orders
      </Link>
    )}

    <Link
      to="/inbox"
      className={`relative font-medium flex items-center hover:text-red-500 transition ${isActive('/inbox') ? 'text-red-600' : 'text-gray-800'}`}
      onClick={() => setIsMobileMenuOpen(false)}
    >
      <MessageSquare className="w-5 h-5 mr-2" />
      Inbox
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
          {unreadCount}
        </span>
      )}
    </Link>

    {/* Profile options */}
    <div className="border-t border-gray-200 pt-2">
      <button
        className="flex items-center justify-between w-full px-2 py-2 font-medium text-gray-800 hover:bg-gray-100 rounded-md"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <span>Profile</span>
        <UserIcon className="w-5 h-5" />
      </button>
      <button
        className="flex items-center justify-between w-full px-2 py-2 font-medium text-red-600 hover:bg-red-100 rounded-md"
        onClick={() => { logout(); setIsMobileMenuOpen(false); }}
      >
        <span>Logout</span>
        <LogOut className="w-5 h-5" />
      </button>
      <button
        id="translate-toggle-button"
        className="flex items-center justify-between w-full px-2 py-2 font-medium text-gray-800 hover:bg-gray-100 rounded-md"
        onClick={toggleTranslate}
      >
        <span>Language</span>
        <Globe className="w-5 h-5" />
      </button>
    </div>
  </div>
)}

      </div>

      {/* Google Translate */}
      <div
        ref={translateRef}
        id="google_translate_element"
        className={`absolute top-20 right-6 bg-white border border-gray-300 p-2 rounded-md shadow-md z-[1000] w-64 overflow-auto transition-opacity ${isTranslateVisible ? 'opacity-100 block' : 'opacity-0 hidden'}`}
      ></div>
    </nav>
  );
};

export default Navbar;
/**/