"use client";
import React, { useState, useEffect } from 'react';
import {
    Briefcase,
    Plus,
    Search,
    Filter,
    RefreshCw,
    LayoutGrid,
    List,
    ChevronRight,
    DollarSign,
    Target,
    TrendingUp,
    Calendar
} from 'lucide-react';
import { clsx } from 'clsx';

interface Deal {
    dealId: string;
    clientName: string;
    title: string;
    amount: number;
    status: 'lead' | 'proposal' | 'negotiation' | 'won' | 'lost';
    probability: number;
    expectedCloseDate: string;
    assignee: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
    lead: { label: 'リード', color: 'bg-gray-100 text-gray-700' },
    proposal: { label: '提案中', color: 'bg-blue-100 text-blue-700' },
    negotiation: { label: '交渉中', color: 'bg-amber-100 text-amber-700' },
    won: { label: '成約', color: 'bg-green-100 text-green-700' },
    lost: { label: '失注', color: 'bg-red-100 text-red-700' },
};

export default function DealsPage() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchDeals = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://localhost:8000/api/v1/deals');
                if (response.ok) {
                    const data = await response.json();
                    setDeals(data.deals || []);
                } else {
                    setDeals(mockDeals);
                }
            } catch (error) {
                console.error('Failed to fetch deals:', error);
                setDeals(mockDeals);
            } finally {
                setLoading(false);
            }
        };
        fetchDeals();
    }, []);

    const mockDeals: Deal[] = [
        { dealId: '1', clientName: '片平農産', title: '人材追加派遣', amount: 500000, status: 'negotiation', probability: 70, expectedCloseDate: '2025-02-15', assignee: '田中' },
        { dealId: '2', clientName: '南九州ファーム', title: '新規取引開始', amount: 800000, status: 'proposal', probability: 40, expectedCloseDate: '2025-02-28', assignee: '山田' },
        { dealId: '3', clientName: '指宿青果', title: '契約更新', amount: 300000, status: 'lead', probability: 20, expectedCloseDate: '2025-03-01', assignee: '田中' },
        { dealId: '4', clientName: '鹿児島農協', title: '登録支援サービス', amount: 1200000, status: 'won', probability: 100, expectedCloseDate: '2025-01-20', assignee: '佐藤' },
    ];

    const groupedByStatus = {
        lead: deals.filter(d => d.status === 'lead'),
        proposal: deals.filter(d => d.status === 'proposal'),
        negotiation: deals.filter(d => d.status === 'negotiation'),
        won: deals.filter(d => d.status === 'won'),
    };

    const stats = {
        total: deals.length,
        pipeline: deals.filter(d => !['won', 'lost'].includes(d.status)).reduce((sum, d) => sum + d.amount, 0),
        won: deals.filter(d => d.status === 'won').length,
        conversion: deals.length > 0 ? ((deals.filter(d => d.status === 'won').length / deals.length) * 100).toFixed(1) : '0',
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">商談管理</h1>
                    <p className="text-gray-500 mt-1">営業パイプラインと顧客管理</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={clsx(
                                "p-2 rounded-md transition-all",
                                viewMode === 'kanban' ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={clsx(
                                "p-2 rounded-md transition-all",
                                viewMode === 'list' ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
                            )}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    <button className="btn btn-secondary">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        同期
                    </button>
                    <button className="btn btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        新規商談
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                        <div className="text-sm text-gray-500">全商談</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                        <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">¥{(stats.pipeline / 1000000).toFixed(1)}M</div>
                        <div className="text-sm text-gray-500">パイプライン</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                        <Target className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{stats.won}</div>
                        <div className="text-sm text-gray-500">成約数</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{stats.conversion}%</div>
                        <div className="text-sm text-gray-500">成約率</div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="card p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="顧客名、案件名で検索..."
                        className="input pl-10"
                    />
                </div>
            </div>

            {/* Kanban Board */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : viewMode === 'kanban' ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {(['lead', 'proposal', 'negotiation', 'won'] as const).map((status) => (
                        <div key={status} className="space-y-3">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <span className={clsx("px-2 py-1 rounded text-xs font-semibold", statusLabels[status].color)}>
                                        {statusLabels[status].label}
                                    </span>
                                    <span className="text-sm text-gray-500">{groupedByStatus[status].length}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {groupedByStatus[status].map((deal) => (
                                    <div
                                        key={deal.dealId}
                                        className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
                                    >
                                        <div className="font-medium text-gray-900 mb-1">{deal.title}</div>
                                        <div className="text-sm text-gray-500 mb-2">{deal.clientName}</div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-semibold text-gray-900">
                                                ¥{(deal.amount / 10000).toFixed(0)}万
                                            </span>
                                            <span className="text-gray-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {deal.expectedCloseDate.slice(5)}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="w-full bg-gray-100 rounded-full h-1.5 mr-2">
                                                <div
                                                    className="bg-blue-500 h-1.5 rounded-full"
                                                    style={{ width: `${deal.probability}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                {deal.probability}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {groupedByStatus[status].length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        案件なし
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>案件名</th>
                                <th>顧客</th>
                                <th>金額</th>
                                <th>ステータス</th>
                                <th>確度</th>
                                <th>予定日</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deals.map((deal) => (
                                <tr key={deal.dealId} className="cursor-pointer">
                                    <td className="font-medium text-gray-900">{deal.title}</td>
                                    <td>{deal.clientName}</td>
                                    <td>¥{deal.amount.toLocaleString()}</td>
                                    <td>
                                        <span className={clsx("badge", statusLabels[deal.status].color)}>
                                            {statusLabels[deal.status].label}
                                        </span>
                                    </td>
                                    <td>{deal.probability}%</td>
                                    <td>{deal.expectedCloseDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
