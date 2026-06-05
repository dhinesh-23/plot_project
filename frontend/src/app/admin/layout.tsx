'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStoredUser } from '@/lib/auth';
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const currentUser = getStoredUser();
        if (!currentUser || currentUser.role !== 'admin') {
            router.push('/login');
        } else {
            setUser(currentUser);
        }
    }, [router]);

    const adminMenu = [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/properties', label: 'Properties', icon: Home },
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/inquiries', label: 'Inquiries', icon: MessageSquare },
        { href: '/admin/settings', label: 'Settings', icon: Settings },
    ];

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 z-40 w-64 h-screen bg-white shadow-lg transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full pt-20">
                    <div className="p-6 border-b">
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                                <span className="text-white text-xl font-bold">🏠</span>
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Admin Panel
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{user.full_name}</p>
                    </div>
                    
                    <nav className="flex-1 p-4 space-y-2">
                        {adminMenu.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition group"
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                    
                    <div className="p-4 border-t">
                        <button
                            onClick={() => {
                                localStorage.clear();
                                router.push('/login');
                            }}
                            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg md:hidden"
            >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Main Content */}
            <main className={`transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}