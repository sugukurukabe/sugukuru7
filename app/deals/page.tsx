"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
    Briefcase,
    Plus,
    Search,
    RefreshCw,
    LayoutGrid,
    List,
    ChevronRight,
    DollarSign,
    Target,
    TrendingUp,
    Calendar,
    X,
    Save,
    Building,
    User,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';

// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sugukuru-api-1027796998462.asia-northeast1.run.app';

interface Deal {
    deal_id: string;
    deal_number?: string;
    deal_name: string;
    client_name: string;
    client_org_id?: string;
    contract_category: string;
    required_headcount: number;
    filled_headcount?: number;
    expected_start_date?: string;
    expected_end_date?: string;
    probability: number;
    status: 'lead' | 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost' | 'on_hold';
    sales_rep_name?: string;
    hourly_rate_no_license?: number;
    hourly_rate_with_license?: number;
    notes?: string;
    updated_at?: string;
}

interface KanbanColumn {
    status: string;
    statusName: string;
    color: string;
    deals: Deal[];
    totalCount: number;
}

interface Organization {
    org_id: string;
    name: string;
    org_type: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    lead: { label: 'リード', color: 'text-gray-700', bgColor: 'bg-gray-100' },
    qualification: { label: 'ヒアリング', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    proposal: { label: '提案中', color: 'text-amber-700', bgColor: 'bg-amber-100' },
    negotiation: { label: '交渉中', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    won: { label: '成約', color: 'text-green-700', bgColor: 'bg-green-100' },
    lost: { label: '失注', color: 'text-red-700', bgColor: 'bg-red-100' },
    on_hold: { label: '保留', color: 'text-purple-700', bgColor: 'bg-purple-100' },
};

const contractCategories = [
    { value: 'dispatch', label: '派遣' },
    { value: 'direct', label: '直接雇用' },
    { value: 'introduction', label: '紹介' },
    { value: 'support', label: '登録支援' },
];

export default function DealsPage() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

    // New deal form
    const [newDeal, setNewDeal] = useState({
        deal_name: '',
        client_name: '',
        client_org_id: '',
        contract_category: 'dispatch',
        required_headcount: 1,
        expected_start_date: '',
        probability: 20,
        notes: '',
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch kanban board data
            const response = await fetch(`${API_BASE}/api/v1/deals/board`);
            if (response.ok) {
                const data = await response.json();
                setColumns(data.columns || []);

                // Flatten deals from all columns
                const allDeals: Deal[] = [];
                (data.columns || []).forEach((col: KanbanColumn) => {
                    allDeals.push(...col.deals);
                });
                setDeals(allDeals);
            } else {
                // Start with empty if API not available
                setDeals([]);
                setColumns([]);
            }

            // Fetch organizations for dropdown
            try {
                const orgsResponse = await fetch(`${API_BASE}/api/v1/organizations/`);
                if (orgsResponse.ok) {
                    const orgsData = await orgsResponse.json();
                    setOrganizations(orgsData || []);
                }
            } catch {
                // Organizations API might not exist yet
            }
        } catch (error) {
            console.error('Failed to fetch deals:', error);
            setDeals([]);
            setColumns([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateDeal = async () => {
        if (!newDeal.deal_name || !newDeal.client_name) {
            alert('案件名と顧客名を入力してください');
            return;
        }

        setSaving(true);
        try {
            // Create deal locally (in production, POST to API)
            const createdDeal: Deal = {
                deal_id: `deal-${Date.now()}`,
                deal_name: newDeal.deal_name,
                client_name: newDeal.client_name,
                client_org_id: newDeal.client_org_id || undefined,
                contract_category: newDeal.contract_category,
                required_headcount: newDeal.required_headcount,
                expected_start_date: newDeal.expected_start_date || undefined,
                probability: newDeal.probability,
                status: 'lead',
                notes: newDeal.notes || undefined,
            };

            setDeals(prev => [createdDeal, ...prev]);

            // Update kanban columns
            setColumns(prev => prev.map(col =>
                col.status === 'lead'
                    ? { ...col, deals: [createdDeal, ...col.deals], totalCount: col.totalCount + 1 }
                    : col
            ));

            setShowCreateModal(false);
            setNewDeal({
                deal_name: '',
                client_name: '',
                client_org_id: '',
                contract_category: 'dispatch',
                required_headcount: 1,
                expected_start_date: '',
                probability: 20,
                notes: '',
            });

            setSuccessMessage('商談を作成しました');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error('Failed to create deal:', err);
            alert('作成に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (dealId: string, newStatus: string) => {
        try {
            const response = await fetch(`${API_BASE}/api/v1/deals/${dealId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                // Update local state
                setDeals(prev => prev.map(d =>
                    d.deal_id === dealId ? { ...d, status: newStatus as Deal['status'] } : d
                ));
                fetchData(); // Refresh to get updated kanban
                setSuccessMessage('ステータスを更新しました');
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    // Filter deals by search
    const filteredDeals = deals.filter(d =>
        d.deal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.client_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Stats calculation
    const stats = {
        total: deals.length,
        pipeline: deals.filter(d => !['won', 'lost'].includes(d.status)).length,
        won: deals.filter(d => d.status === 'won').length,
        conversion: deals.length > 0
            ? ((deals.filter(d => d.status === 'won').length / deals.length) * 100).toFixed(1)
            : '0',
    };

    // Visible columns for kanban (exclude lost and on_hold by default)
    const visibleColumns = columns.filter(col => !['lost', 'on_hold'].includes(col.status));

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Success Message */}
            {successMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fadeIn flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    {successMessage}
                </div>
            )}

            {/* Create Deal Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">新規商談作成</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    案件名 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newDeal.deal_name}
                                    onChange={(e) => setNewDeal({ ...newDeal, deal_name: e.target.value })}
                                    className="input w-full"
                                    placeholder="例: 人材追加派遣、新規取引開始"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    顧客名 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newDeal.client_name}
                                    onChange={(e) => setNewDeal({ ...newDeal, client_name: e.target.value })}
                                    className="input w-full"
                                    placeholder="顧客・企業名を入力"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    契約カテゴリ
                                </label>
                                <select
                                    value={newDeal.contract_category}
                                    onChange={(e) => setNewDeal({ ...newDeal, contract_category: e.target.value })}
                                    className="input w-full"
                                >
                                    {contractCategories.map(cat => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        必要人数
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newDeal.required_headcount}
                                        onChange={(e) => setNewDeal({ ...newDeal, required_headcount: parseInt(e.target.value) || 1 })}
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        確度 (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={newDeal.probability}
                                        onChange={(e) => setNewDeal({ ...newDeal, probability: parseInt(e.target.value) || 0 })}
                                        className="input w-full"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    開始予定日
                                </label>
                                <input
                                    type="date"
                                    value={newDeal.expected_start_date}
                                    onChange={(e) => setNewDeal({ ...newDeal, expected_start_date: e.target.value })}
                                    className="input w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    備考
                                </label>
                                <textarea
                                    value={newDeal.notes}
                                    onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                                    className="input w-full min-h-[80px]"
                                    placeholder="メモや補足情報を入力..."
                                />
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="btn btn-secondary"
                                disabled={saving}
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleCreateDeal}
                                className="btn btn-primary flex items-center gap-2"
                                disabled={saving || !newDeal.deal_name || !newDeal.client_name}
                            >
                                {saving ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {saving ? '作成中...' : '作成'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    <button
                        onClick={fetchData}
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        <RefreshCw className={clsx("w-4 h-4 mr-2", loading && "animate-spin")} />
                        同期
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-primary"
                    >
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
                    <div className="p-3 bg-amber-100 rounded-xl">
                        <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{stats.pipeline}</div>
                        <div className="text-sm text-gray-500">進行中</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                        <Target className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{stats.won}</div>
                        <div className="text-sm text-gray-500">成約数</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-purple-600" />
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
                        className="input pl-10 w-full"
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">商談データを読み込み中...</p>
                    </div>
                </div>
            ) : viewMode === 'kanban' ? (
                /* Kanban View */
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {visibleColumns.map((column) => (
                        <div key={column.status} className="space-y-3">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="px-2 py-1 rounded text-xs font-semibold"
                                        style={{ backgroundColor: column.color + '20', color: column.color }}
                                    >
                                        {column.statusName}
                                    </span>
                                    <span className="text-sm text-gray-500">{column.totalCount}</span>
                                </div>
                            </div>
                            <div className="space-y-2 min-h-[200px]">
                                {column.deals
                                    .filter(d =>
                                        d.deal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        d.client_name.toLowerCase().includes(searchQuery.toLowerCase())
                                    )
                                    .map((deal) => (
                                        <div
                                            key={deal.deal_id}
                                            className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
                                            onClick={() => setSelectedDeal(deal)}
                                        >
                                            <div className="font-medium text-gray-900 mb-1">{deal.deal_name}</div>
                                            <div className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                                                <Building className="w-3 h-3" />
                                                {deal.client_name}
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">
                                                    {contractCategories.find(c => c.value === deal.contract_category)?.label || deal.contract_category}
                                                </span>
                                                <span className="text-gray-400 flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {deal.required_headcount}名
                                                </span>
                                            </div>
                                            {deal.expected_start_date && (
                                                <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {deal.expected_start_date}開始予定
                                                </div>
                                            )}
                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="w-full bg-gray-100 rounded-full h-1.5 mr-2">
                                                    <div
                                                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                                                        style={{ width: `${deal.probability}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                                    {deal.probability}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                {column.deals.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                                        案件なし
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* List View */
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>案件名</th>
                                <th>顧客</th>
                                <th>カテゴリ</th>
                                <th>人数</th>
                                <th>ステータス</th>
                                <th>確度</th>
                                <th>開始予定</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDeals.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">
                                        商談データがありません
                                    </td>
                                </tr>
                            ) : (
                                filteredDeals.map((deal) => (
                                    <tr
                                        key={deal.deal_id}
                                        className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => setSelectedDeal(deal)}
                                    >
                                        <td className="font-medium text-gray-900">{deal.deal_name}</td>
                                        <td>{deal.client_name}</td>
                                        <td>
                                            {contractCategories.find(c => c.value === deal.contract_category)?.label || deal.contract_category}
                                        </td>
                                        <td>{deal.required_headcount}名</td>
                                        <td>
                                            <span className={clsx(
                                                "px-2 py-1 rounded text-xs font-semibold",
                                                statusConfig[deal.status]?.bgColor,
                                                statusConfig[deal.status]?.color
                                            )}>
                                                {statusConfig[deal.status]?.label || deal.status}
                                            </span>
                                        </td>
                                        <td>{deal.probability}%</td>
                                        <td>{deal.expected_start_date || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty State */}
            {!loading && deals.length === 0 && (
                <div className="card p-12 text-center">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">商談がありません</h3>
                    <p className="text-gray-500 mb-4">新しい商談を作成して営業活動を開始しましょう</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-primary mx-auto flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        新規商談作成
                    </button>
                </div>
            )}

            {/* Info Card */}
            <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="p-5">
                    <h3 className="font-semibold text-gray-900 mb-2">📋 商談管理について</h3>
                    <div className="text-sm text-gray-600 space-y-2">
                        <p>
                            このページでは、営業活動の商談をカンバン形式またはリスト形式で管理できます。
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="bg-white/50 rounded-lg p-3">
                                <h4 className="font-medium text-gray-800 mb-1">📊 データ構成</h4>
                                <ul className="text-xs text-gray-600 space-y-1">
                                    <li>• <strong>deals</strong>テーブル: 商談情報</li>
                                    <li>• <strong>organizations</strong>テーブル: 顧客企業</li>
                                    <li>• <strong>deal_activities</strong>: 活動履歴</li>
                                </ul>
                            </div>
                            <div className="bg-white/50 rounded-lg p-3">
                                <h4 className="font-medium text-gray-800 mb-1">🔄 ステータス遷移</h4>
                                <ul className="text-xs text-gray-600 space-y-1">
                                    <li>リード → ヒアリング → 提案中 → 交渉中</li>
                                    <li>→ 成約 / 失注 / 保留</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
