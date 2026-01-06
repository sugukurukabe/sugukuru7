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
    Clock,
    RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';

// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sugukuru-api-1027796998462.asia-northeast1.run.app';

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

// API Response types
interface Person {
    person_id: string;
    names: { full_name: string };
    current_status: string;
    demographics: { nationality?: string };
}

interface Organization {
    org_id: string;
    name: string;
}

interface DashboardStats {
    totalPeople: number;
    activePeople: number;
    applyingPeople: number;
    resignedPeople: number;
    totalOrganizations: number;
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<QuickStat[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch people data
            const peopleRes = await fetch(`${API_BASE}/api/v1/people/`);
            if (!peopleRes.ok) throw new Error('Failed to fetch people');
            const people: Person[] = await peopleRes.json();

            // Fetch organizations
            const orgsRes = await fetch(`${API_BASE}/api/v1/organizations/`);
            if (!orgsRes.ok) throw new Error('Failed to fetch organizations');
            const organizations: Organization[] = await orgsRes.json();

            // Calculate stats
            const activePeople = people.filter(p => p.current_status === 'monitoring').length;
            const applyingPeople = people.filter(p => p.current_status === 'applying').length;
            const resignedPeople = people.filter(p => p.current_status === 'resigned').length;
            const preparingPeople = people.filter(p => p.current_status === 'preparing').length;

            const statsData: DashboardStats = {
                totalPeople: people.length,
                activePeople,
                applyingPeople,
                resignedPeople,
                totalOrganizations: organizations.length
            };

            setDashboardStats(statsData);

            setStats([
                {
                    label: '登録人材数',
                    value: people.length,
                    change: `管理中: ${activePeople}名`,
                    trend: 'up',
                    icon: <Users className="w-5 h-5" />,
                    color: 'blue'
                },
                {
                    label: '申請中',
                    value: applyingPeople,
                    change: `準備中: ${preparingPeople}名`,
                    trend: applyingPeople > 0 ? 'up' : 'neutral',
                    icon: <Clock className="w-5 h-5" />,
                    color: 'amber'
                },
                {
                    label: '登録企業数',
                    value: organizations.length,
                    change: '派遣先・委託先',
                    trend: 'up',
                    icon: <Briefcase className="w-5 h-5" />,
                    color: 'purple'
                },
                {
                    label: '退職済み',
                    value: resignedPeople,
                    change: '要確認',
                    trend: 'neutral',
                    icon: <AlertTriangle className="w-5 h-5" />,
                    color: 'red'
                },
            ]);

            // Generate alerts from data
            const generatedAlerts: any[] = [];

            // Find people with upcoming visa expiry (if we had that data)
            const applyingNames = people
                .filter(p => p.current_status === 'applying')
                .slice(0, 3)
                .map(p => p.names.full_name);

            if (applyingNames.length > 0) {
                generatedAlerts.push({
                    type: 'warning',
                    message: `${applyingNames[0]} 他${applyingNames.length - 1}名が申請中です`,
                    link: '/candidates'
                });
            }

            if (organizations.length > 50) {
                generatedAlerts.push({
                    type: 'info',
                    message: `${organizations.length}社の企業が登録されています`,
                    link: '/organizations'
                });
            }

            setAlerts(generatedAlerts);
            setLoading(false);

        } catch (err) {
            console.error('Dashboard data fetch error:', err);
            setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const modules: ModuleCard[] = [
        {
            title: '人材管理',
            description: '特定技能人材のデータベース管理とスキルマッチング',
            href: '/candidates',
            icon: <Users className="w-6 h-6 text-blue-600" />,
            stats: [
                { label: '登録数', value: dashboardStats?.totalPeople || 0 },
                { label: '管理中', value: dashboardStats?.activePeople || 0 }
            ]
        },
        {
            title: '配置管理',
            description: '日次配置計画と派遣先のスロット管理',
            href: '/dispatch',
            icon: <Calendar className="w-6 h-6 text-green-600" />,
            stats: [
                { label: '今週配置', value: '-' },
                { label: '充足率', value: '-' }
            ]
        },
        {
            title: '商談管理',
            description: '新規取引先との商談進捗管理',
            href: '/deals',
            icon: <Briefcase className="w-6 h-6 text-purple-600" />,
            stats: [
                { label: '進行中', value: '-' },
                { label: '今月成約', value: '-' }
            ]
        },
        {
            title: '経営KPI',
            description: '売上・コスト・人材効率の分析',
            href: '/kpi',
            icon: <BarChart3 className="w-6 h-6 text-orange-600" />,
            stats: [
                { label: '達成率', value: '-' },
                { label: '前月比', value: '-' }
            ]
        },
        {
            title: '入管届出',
            description: '入国管理局への届出管理と期限追跡',
            href: '/notices',
            icon: <ShieldCheck className="w-6 h-6 text-red-600" />,
            stats: [
                { label: '申請中', value: dashboardStats?.applyingPeople || 0 },
                { label: '今月期限', value: '-' }
            ]
        },
        {
            title: 'ドキュメント',
            description: '書類作成とGCSファイル管理',
            href: '/documents',
            icon: <FileText className="w-6 h-6 text-cyan-600" />,
            stats: [
                { label: '企業数', value: dashboardStats?.totalOrganizations || 0 },
                { label: '完了済', value: '-' }
            ]
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">データを読み込み中...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">エラーが発生しました</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        再試行
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
                    <p className="text-gray-500 mt-1">スグクル 3.0 統合管理システム</p>
                </div>
                <button
                    onClick={fetchDashboardData}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                    <RefreshCw className="w-4 h-4" />
                    更新
                </button>
            </div>

            {/* Alerts Section */}
            {alerts.length > 0 && (
                <div className="space-y-3">
                    {alerts.map((alert, idx) => (
                        <Link
                            key={idx}
                            href={alert.link}
                            className={clsx(
                                'flex items-center gap-3 p-4 rounded-xl border transition-all',
                                alert.type === 'warning' && 'bg-amber-50 border-amber-200 hover:bg-amber-100',
                                alert.type === 'info' && 'bg-blue-50 border-blue-200 hover:bg-blue-100',
                                alert.type === 'success' && 'bg-green-50 border-green-200 hover:bg-green-100'
                            )}
                        >
                            {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                            {alert.type === 'info' && <Clock className="w-5 h-5 text-blue-600" />}
                            {alert.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                            <span className="flex-1 text-gray-800">{alert.message}</span>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                        </Link>
                    ))}
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={clsx(
                                'w-10 h-10 rounded-lg flex items-center justify-center',
                                stat.color === 'blue' && 'bg-blue-100 text-blue-600',
                                stat.color === 'green' && 'bg-green-100 text-green-600',
                                stat.color === 'purple' && 'bg-purple-100 text-purple-600',
                                stat.color === 'amber' && 'bg-amber-100 text-amber-600',
                                stat.color === 'red' && 'bg-red-100 text-red-600',
                            )}>
                                {stat.icon}
                            </div>
                            {stat.change && (
                                <span className={clsx(
                                    'text-sm font-medium px-2 py-1 rounded-full',
                                    stat.trend === 'up' && 'bg-green-100 text-green-700',
                                    stat.trend === 'down' && 'bg-red-100 text-red-700',
                                    stat.trend === 'neutral' && 'bg-gray-100 text-gray-700',
                                )}>
                                    {stat.change}
                                </span>
                            )}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Module Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((module, idx) => (
                    <Link
                        key={idx}
                        href={module.href}
                        className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition">
                                {module.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                                    {module.title}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                    {module.description}
                                </p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </div>
                        {module.stats && (
                            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
                                {module.stats.map((s, sIdx) => (
                                    <div key={sIdx} className="flex-1">
                                        <div className="text-lg font-bold text-gray-900">{s.value}</div>
                                        <div className="text-xs text-gray-500">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Link>
                ))}
            </div>

            {/* Data Source Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    <div>
                        <p className="text-sm font-medium text-blue-900">
                            データソース: 本番API ({API_BASE.replace('https://', '').split('.')[0]})
                        </p>
                        <p className="text-xs text-blue-700 mt-0.5">
                            最終更新: {new Date().toLocaleString('ja-JP')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
