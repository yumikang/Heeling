"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Music, Users, Settings, LogOut, Loader2, Wand2, Smartphone, MessageSquare, Image } from 'lucide-react';

const MENU_ITEMS = [
    { icon: LayoutDashboard, label: '대시보드', href: '/admin' },
    { icon: Wand2, label: 'AI 음악 생성', href: '/admin/generate' },
    { icon: Music, label: '콘텐츠 관리', href: '/admin/content' },
    { icon: Image, label: '배너 관리', href: '/admin/banners' },
    { icon: Smartphone, label: '앱 관리', href: '/admin/app-manage' },
    { icon: MessageSquare, label: '팝업 관리', href: '/admin/popups' },
    { icon: Users, label: '회원 관리', href: '/admin/users' },
    { icon: Settings, label: '설정', href: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/admin/login');
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="flex h-screen bg-black text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-800 flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        Heeling Admin
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {MENU_ITEMS.map((item) => {
                        const isActive = item.href === '/admin'
                            ? pathname === '/admin'
                            : pathname?.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30'
                                    : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 w-full transition-colors disabled:opacity-50"
                    >
                        {isLoggingOut ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <LogOut size={20} />
                        )}
                        <span className="font-medium">
                            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-gray-950">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
