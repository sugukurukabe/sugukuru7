"use client";
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
    Search,
    Bell,
    ChevronDown,
    Menu,
    Plus
} from 'lucide-react';
import { clsx } from 'clsx';

const pageNames: Record<string, string> = {
    '/': 'ダッシュボード',
    '/candidates': '人材管理',
    '/dispatch': '配置管理',
    '/deals': '商談管理',
    '/kpi': '経営KPI',
    '/notices': '入管届出',
    '/documents': 'ドキュメント',
};

export default function Header() {
    const pathname = usePathname();
    const [searchOpen, setSearchOpen] = useState(false);

    // Get page title
    const getPageTitle = () => {
        if (!pathname) return 'スグクル3.0';
        if (pageNames[pathname]) return pageNames[pathname];
        // Handle dynamic routes
        if (pathname.startsWith('/candidates/')) return '人材詳細';
        return 'スグクル3.0';
    };

    return (
        <header className="fixed top-0 left-60 right-0 h-16 bg-white border-b border-gray-200 z-30">
            <div className="h-full px-6 flex items-center justify-between">
                {/* Left: Page Title & Breadcrumb */}
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold text-gray-900">
                        {getPageTitle()}
                    </h1>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    {/* Global Search */}
                    <div className="relative">
                        <div className="flex items-center">
                            <div className={clsx(
                                "flex items-center transition-all duration-200",
                                searchOpen ? "w-64" : "w-auto"
                            )}>
                                {searchOpen ? (
                                    <input
                                        type="text"
                                        placeholder="検索..."
                                        className="input pr-10"
                                        autoFocus
                                        onBlur={() => setSearchOpen(false)}
                                    />
                                ) : (
                                    <button
                                        onClick={() => setSearchOpen(true)}
                                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                                    >
                                        <Search className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Add Button */}
                    <button className="btn btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>新規作成</span>
                        <ChevronDown className="w-4 h-4 opacity-60" />
                    </button>

                    {/* Notifications */}
                    <button className="relative p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    </button>
                </div>
            </div>
        </header>
    );
}
