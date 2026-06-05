'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Menu, 
  X, 
  Home, 
  Building2, 
  LayoutDashboard, 
  LogIn, 
  UserPlus, 
  LogOut, 
  ChevronDown,
  Shield,
  Settings,
  User as UserIcon
} from 'lucide-react';
import { getStoredUser, clearAuth, User as UserType } from '@/lib/auth';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Load user on mount and when pathname changes (after login redirect)
    const loadUser = () => {
      const storedUser = getStoredUser();
      console.log('Navbar loading user:', storedUser);
      setUser(storedUser);
      setIsLoading(false);
    };
    
    loadUser();
    
    // Listen for storage changes (in case user logs in from another tab)
    const handleStorageChange = () => {
      loadUser();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/properties', label: 'Properties', icon: Building2 },
    ...(user ? [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    ...(user?.role === 'admin' ? [{ href: '/admin/dashboard', label: 'Admin', icon: Shield }] : []),
  ];

  // Show loading state
  if (isLoading) {
    return (
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl"></div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EstateHub
              </span>
            </div>
            <div className="w-24 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        'bg-white/95 backdrop-blur-md shadow-lg'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition">
                <span className="text-white text-xl font-bold">🏠</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EstateHub
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center space-x-1 transition-all duration-200 ${
                    pathname === href || pathname?.startsWith(href + '/')
                      ? 'text-blue-600 font-semibold'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition">
                    <UserIcon className="w-4 h-4" />
                    <span>{user.full_name?.split(' ')[0] || user.full_name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg hidden group-hover:block overflow-hidden">
                    <div className="p-3 border-b bg-gray-50">
                      <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      {user.role === 'admin' && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                          Admin
                        </span>
                      )}
                    </div>
                    <Link
                      href="/dashboard"
                      className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin/dashboard"
                        className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </Link>
                    <div className="border-t">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-gray-700 hover:text-blue-600 transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition transform hover:scale-105"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 px-4 md:hidden overflow-y-auto">
          <div className="space-y-4">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition"
              >
                <Icon className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">{label}</span>
              </Link>
            ))}
            
            {user && user.role === 'admin' && (
              <Link
                href="/admin/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition"
              >
                <Shield className="w-5 h-5 text-purple-600" />
                <span className="text-gray-700">Admin Panel</span>
              </Link>
            )}
            
            {!user ? (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition"
                >
                  <LogIn className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Login</span>
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Sign Up</span>
                </Link>
              </>
            ) : (
              <div className="border-t pt-4">
                <div className="p-3 bg-gray-50 rounded-xl mb-2">
                  <p className="font-semibold text-gray-900">{user.full_name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  {user.role === 'admin' && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                      Admin
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 transition w-full"
                >
                  <LogOut className="w-5 h-5 text-red-600" />
                  <span className="text-red-600">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}