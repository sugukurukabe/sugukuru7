"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Calendar,
    Briefcase,
    FileText,
    ShieldCheck,
    BarChart3,
    Settings,
    HelpCircle
} from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
    { name: 'ダッシュボード', href: '/', icon: LayoutDashboard },
    { name: '人材管理', href: '/candidates', icon: Users },
    { name: '配置管理', href: '/dispatch', icon: Calendar },
    { name: '商談管理', href: '/deals', icon: Briefcase },
    { name: '経営KPI', href: '/kpi', icon: BarChart3 },
    { name: '入管届出', href: '/notices', icon: ShieldCheck },
    { name: 'ドキュメント', href: '/documents', icon: FileText },
];

const secondaryNavigation = [
    { name: '設定', href: '/settings', icon: Settings },
    { name: 'ヘルプ', href: '/help', icon: HelpCircle },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 flex flex-col z-40">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-gray-100">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                        <span className="text-white font-black text-sm">S</span>
                    </div>
                    <div>
                        <span className="font-bold text-gray-900">スグクル</span>
                        <span className="text-xs text-gray-400 ml-1">3.0</span>
                    </div>
                </Link>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
                    メインメニュー
                </div>
                {navigation.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname?.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                'nav-item',
                                isActive && 'active'
                            )}
                        >
                            <item.icon className="nav-icon" />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Secondary Navigation */}
            <div className="px-3 py-4 border-t border-gray-100">
                {secondaryNavigation.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="nav-item text-gray-500"
                    >
                        <item.icon className="nav-icon" />
                        <span>{item.name}</span>
                    </Link>
                ))}
            </div>

            {/* User Section */}
            <div className="px-4 py-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-semibold text-sm">K</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">Kabe</p>
                        <p className="text-xs text-gray-500 truncate">管理者</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
