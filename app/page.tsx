"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users,
    Calendar,
    Briefcase,
    BarChart3,
    ShieldCheck,
    FileText,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    AlertTriangle,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { clsx } from 'clsx';

// Quick stats type
interface QuickStat {
    label: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon: React.ReactNode;
    color: string;
}

// Module card type
interface ModuleCard {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    stats?: { label: string; value: string | number }[];
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<QuickStat[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);

    useEffect(() => {
        // Load dashboard data
        const loadData = async () => {
            // In production, this would fetch from API
            setStats([
                {
                    label: '稼働中人材',
                    value: 48,
                    change: '+3',
                    trend: 'up',
                    icon: <Users className="w-5 h-5" />,
                    color: 'blue'
                },
                {
                    label: '今月の売上',
                    value: '¥5.76M',
                    change: '+8.5%',
                    trend: 'up',
                    icon: <TrendingUp className="w-5 h-5" />,
                    color: 'green'
                },
                {
                    label: '進行中商談',
                    value: 14,
                    change: '+2',
                    trend: 'up',
                    icon: <Briefcase className="w-5 h-5" />,
                    color: 'purple'
                },
                {
                    label: '届出期限',
                    value: 3,
                    change: '要対応',
                    trend: 'neutral',
                    icon: <AlertTriangle className="w-5 h-5" />,
                    color: 'amber'
                },
            ]);

            setAlerts([
                { type: 'warning', message: 'NGUYEN VAN A の派遣先変更届出が期限2日前です', link: '/notices' },
                { type: 'info', message: '片平農産の火曜日に1名欠員があります', link: '/dispatch' },
            ]);

            setLoading(false);
        };

        loadData();
    }, []);

    const modules: ModuleCard[] = [
        {
            title: '人材管理',
            description: '特定技能人材のデータベース管理とスキルマッチング',
            href: '/candidates',
            icon: <Users className="w-6 h-6 text-blue-600" />,
            stats: [
                { label: '登録人材', value: 298 },
                { label: '稼働中', value: 48 },
            ]
        },
        {
            title: '配置管理',
            description: '週次の人員配置とシミュレーション',
            href: '/dispatch',
            icon: <Calendar className="w-6 h-6 text-orange-600" />,
            stats: [
                { label: '充足率', value: '92.3%' },
                { label: '未配置', value: 4 },
            ]
        },
        {
            title: '商談管理',
            description: '営業パイプラインと顧客管理',
            href: '/deals',
            icon: <Briefcase className="w-6 h-6 text-purple-600" />,
            stats: [
                { label: '進行中', value: 14 },
                { label: '成約率', value: '35.5%' },
            ]
        },
        {
            title: '経営KPI',
            description: '全社業績とトレンド分析',
            href: '/kpi',
            icon: <BarChart3 className="w-6 h-6 text-green-600" />,
            stats: [
                { label: '達成率', value: '96%' },
            ]
        },
        {
            title: '入管届出',
            description: '届出書類の自動生成と期限管理',
            href: '/notices',
            icon: <ShieldCheck className="w-6 h-6 text-red-600" />,
            stats: [
                { label: '期限内', value: 3 },
                { label: '完了', value: 12 },
            ]
        },
        {
            title: 'ドキュメント',
            description: '契約書・申請書類の保管と管理',
            href: '/documents',
            icon: <FileText className="w-6 h-6 text-gray-600" />,
            stats: [
                { label: '書類数', value: 156 },
            ]
        },
    ];

    const getTrendIcon = (trend: string) => {
        if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
        if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
        return <Clock className="w-4 h-4 text-amber-600" />;
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">おはようございます 👋</h1>
                    <p className="text-gray-500 mt-1">スグクル3.0へようこそ。本日の状況をご確認ください。</p>
                </div>
                <div className="text-sm text-gray-500">
                    {new Date().toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                    })}
                </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="space-y-2">
                    {alerts.map((alert, idx) => (
                        <Link
                            key={idx}
                            href={alert.link}
                            className={clsx(
                                "flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-sm",
                                alert.type === 'warning'
                                    ? "bg-amber-50 border-amber-200 text-amber-800"
                                    : "bg-blue-50 border-blue-200 text-blue-800"
                            )}
                        >
                            {alert.type === 'warning'
                                ? <AlertTriangle className="w-5 h-5" />
                                : <Clock className="w-5 h-5" />
                            }
                            <span className="flex-1 text-sm font-medium">{alert.message}</span>
                            <ArrowRight className="w-4 h-4 opacity-60" />
                        </Link>
                    ))}
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="stat-card">
                        <div className="flex items-center justify-between mb-3">
                            <div className={clsx(
                                "p-2 rounded-lg",
                                stat.color === 'blue' && "bg-blue-100 text-blue-600",
                                stat.color === 'green' && "bg-green-100 text-green-600",
                                stat.color === 'purple' && "bg-purple-100 text-purple-600",
                                stat.color === 'amber' && "bg-amber-100 text-amber-600",
                            )}>
                                {stat.icon}
                            </div>
                            {stat.trend && (
                                <div className="flex items-center gap-1 text-xs font-medium">
                                    {getTrendIcon(stat.trend)}
                                    <span className={clsx(
                                        stat.trend === 'up' && "text-green-600",
                                        stat.trend === 'down' && "text-red-600",
                                        stat.trend === 'neutral' && "text-amber-600"
                                    )}>
                                        {stat.change}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Module Cards */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">モジュール</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modules.map((module, idx) => (
                        <Link
                            key={idx}
                            href={module.href}
                            className="card p-5 group hover:shadow-md hover:border-gray-300 transition-all"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-gray-100 transition-colors">
                                    {module.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {module.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                        {module.description}
                                    </p>
                                    {module.stats && (
                                        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
                                            {module.stats.map((s, i) => (
                                                <div key={i}>
                                                    <div className="text-lg font-bold text-gray-900">{s.value}</div>
                                                    <div className="text-xs text-gray-500">{s.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Footer Info */}
            <div className="pt-6 border-t border-gray-200 flex items-center justify-between text-sm text-gray-400">
                <span>スグクル3.0 • 農業特定技能人材の派遣・登録支援事業向け独自OS</span>
                <span>Build v7.0.4-prod • Asia-Northeast1</span>
            </div>
        </div>
    );
}
