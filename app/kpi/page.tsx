"use client";
import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    Users,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Target,
    CheckCircle2,
    RefreshCw,
    Calendar,
    ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';

interface KPIMetric {
    value: number;
    target: number;
    achievement: number;
    trend?: 'up' | 'down' | 'stable';
    changePercent?: number;
}

interface CompanyKPI {
    period: string;
    periodLabel: string;
    summary: {
        revenue: KPIMetric;
        activeWorkers: KPIMetric;
        utilizationRate: KPIMetric;
        dealConversionRate: KPIMetric;
        newWorkers: KPIMetric;
        newClients: KPIMetric;
        noticeComplianceRate: KPIMetric;
    };
    byDivision: {
        division: string;
        divisionName: string;
        revenue: number;
        revenueShare: number;
        workers: number;
        utilizationRate: number;
    }[];
}

export default function KPIDashboardPage() {
    const [data, setData] = useState<CompanyKPI | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('2025-01');

    useEffect(() => {
        // API接続 - 実際のデータを取得
        const fetchKPI = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/v1/kpi/company?period=${selectedPeriod}`);
                if (response.ok) {
                    const apiData = await response.json();
                    setData(apiData);
                } else {
                    // Fallback to mock data if API fails
                    setData(mockData);
                }
            } catch (error) {
                console.error('Failed to fetch KPI:', error);
                setData(mockData);
            } finally {
                setLoading(false);
            }
        };

        fetchKPI();
    }, [selectedPeriod]);

    // Mock data for development/fallback
    const mockData: CompanyKPI = {
        period: "2025-01",
        periodLabel: "2025年1月",
        summary: {
            revenue: { value: 5760000, target: 6000000, achievement: 96.0, trend: "up", changePercent: 8.5 },
            activeWorkers: { value: 48, target: 52, achievement: 92.3, trend: "stable", changePercent: 2.1 },
            utilizationRate: { value: 87.3, target: 90.0, achievement: 97.0, trend: "up" },
            dealConversionRate: { value: 35.5, target: 40.0, achievement: 88.8, trend: "up" },
            newWorkers: { value: 5, target: 8, achievement: 62.5 },
            newClients: { value: 2, target: 3, achievement: 66.7 },
            noticeComplianceRate: { value: 98.5, target: 100.0, achievement: 98.5 }
        },
        byDivision: [
            { division: "dispatch", divisionName: "派遣事業", revenue: 3000000, revenueShare: 52.1, workers: 25, utilizationRate: 89.3 },
            { division: "subcontracting", divisionName: "農受託事業", revenue: 1800000, revenueShare: 31.3, workers: 15, utilizationRate: 88.2 },
            { division: "support", divisionName: "登録支援事業", revenue: 960000, revenueShare: 16.6, workers: 8, utilizationRate: 80.0 }
        ]
    };

    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return `¥${(value / 1000000).toFixed(1)}M`;
        }
        return `¥${value.toLocaleString()}`;
    };

    const getTrendIcon = (trend?: string) => {
        if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
        if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
        return null;
    };

    const getAchievementColor = (achievement: number) => {
        if (achievement >= 100) return 'text-green-600 bg-green-100';
        if (achievement >= 80) return 'text-blue-600 bg-blue-100';
        if (achievement >= 60) return 'text-amber-600 bg-amber-100';
        return 'text-red-600 bg-red-100';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">経営KPI</h1>
                    <p className="text-gray-500 mt-1">全社業績とトレンド分析</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="input w-40"
                    >
                        <option value="2025-01">2025年1月</option>
                        <option value="2024-12">2024年12月</option>
                        <option value="2024-11">2024年11月</option>
                    </select>
                    <button className="btn btn-secondary">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                            {getTrendIcon(data.summary.revenue.trend)}
                            <span className="text-green-600 font-medium">
                                +{data.summary.revenue.changePercent}%
                            </span>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(data.summary.revenue.value)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">今月の売上</div>
                    <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${Math.min(data.summary.revenue.achievement, 100)}%` }}
                            />
                        </div>
                        <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded", getAchievementColor(data.summary.revenue.achievement))}>
                            {data.summary.revenue.achievement}%
                        </span>
                    </div>
                </div>

                {/* Active Workers */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                            {getTrendIcon(data.summary.activeWorkers.trend)}
                            <span className="text-blue-600 font-medium">
                                +{data.summary.activeWorkers.changePercent}%
                            </span>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {data.summary.activeWorkers.value}<span className="text-lg text-gray-400">名</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">稼働中人材</div>
                    <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.min(data.summary.activeWorkers.achievement, 100)}%` }}
                            />
                        </div>
                        <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded", getAchievementColor(data.summary.activeWorkers.achievement))}>
                            {data.summary.activeWorkers.achievement}%
                        </span>
                    </div>
                </div>

                {/* Utilization Rate */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Target className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {data.summary.utilizationRate.value}<span className="text-lg text-gray-400">%</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">稼働率</div>
                    <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-500 rounded-full"
                                style={{ width: `${Math.min(data.summary.utilizationRate.achievement, 100)}%` }}
                            />
                        </div>
                        <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded", getAchievementColor(data.summary.utilizationRate.achievement))}>
                            {data.summary.utilizationRate.achievement}%
                        </span>
                    </div>
                </div>

                {/* Compliance */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {data.summary.noticeComplianceRate.value}<span className="text-lg text-gray-400">%</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">届出遵守率</div>
                    <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${Math.min(data.summary.noticeComplianceRate.achievement, 100)}%` }}
                            />
                        </div>
                        <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded", getAchievementColor(data.summary.noticeComplianceRate.achievement))}>
                            {data.summary.noticeComplianceRate.achievement}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Division Breakdown & Secondary Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Division Breakdown */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="font-semibold text-gray-900">事業別内訳</h2>
                    </div>
                    <div className="card-body space-y-4">
                        {data.byDivision.map((div) => (
                            <div key={div.division} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">{div.divisionName}</span>
                                    <span className="text-sm text-gray-500">
                                        {formatCurrency(div.revenue)} • {div.revenueShare}%
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                        style={{ width: `${div.revenueShare}%` }}
                                    />
                                </div>
                                <div className="flex gap-4 text-xs text-gray-500">
                                    <span>人員: {div.workers}名</span>
                                    <span>稼働率: {div.utilizationRate}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Secondary Metrics */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="font-semibold text-gray-900">営業指標</h2>
                    </div>
                    <div className="card-body">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="text-2xl font-bold text-gray-900">
                                    {data.summary.dealConversionRate.value}%
                                </div>
                                <div className="text-sm text-gray-500 mt-1">成約率</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="text-2xl font-bold text-gray-900">
                                    {data.summary.newWorkers.value}<span className="text-base text-gray-400">名</span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">新規人材</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="text-2xl font-bold text-gray-900">
                                    {data.summary.newClients.value}<span className="text-base text-gray-400">社</span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">新規取引先</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="text-2xl font-bold text-gray-900">14</div>
                                <div className="text-sm text-gray-500 mt-1">進行中商談</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
