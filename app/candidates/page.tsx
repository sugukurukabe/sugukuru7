"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Filter,
    Phone,
    Eye,
    FileText,
    X,
    RefreshCw,
    Users,
    AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';

// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sugukuru-api-1027796998462.asia-northeast1.run.app';

// Person type from API
interface Person {
    person_id: string;
    names: {
        full_name: string;
        full_name_kana?: string;
        legal_last?: string;
        legal_first?: string;
    };
    demographics: {
        gender?: string;
        nationality?: string;
        date_of_birth?: string;
    };
    contact_info: {
        email?: string;
        phone?: string;
    };
    current_status: string;
    current_status_notes?: string;
    nationality?: string;
    current_visa_type?: string;
    visa_expiry_date?: string;
    created_at: string;
    updated_at?: string;
}

const nationalityLabels: Record<string, string> = {
    indonesia: 'インドネシア',
    vietnam: 'ベトナム',
    philippines: 'フィリピン',
    myanmar: 'ミャンマー',
    china: '中国',
    cambodia: 'カンボジア',
    nepal: 'ネパール',
    thailand: 'タイ',
    インドネシア: 'インドネシア',
    ベトナム: 'ベトナム',
    フィリピン: 'フィリピン',
    ミャンマー: 'ミャンマー',
    中国: '中国',
    other: 'その他',
};

const statusLabels: Record<string, { label: string; color: string }> = {
    monitoring: { label: '管理中', color: 'success' },
    applying: { label: '申請中', color: 'warning' },
    preparing: { label: '準備中', color: 'info' },
    resigned: { label: '退職済み', color: 'danger' },
    lost: { label: '失注', color: 'neutral' },
    hold: { label: '保留', color: 'neutral' },
};

const visaLabels: Record<string, string> = {
    '特定技能1号': '特定技能1号',
    '特定技能2号': '特定技能2号',
    '技能実習1号': '技能実習1号',
    '技能実習2号': '技能実習2号',
    '技能実習3号': '技能実習3号',
    '特定活動': '特定活動',
    tokutei_gino_1: '特定技能1号',
    tokutei_gino_2: '特定技能2号',
    other: 'その他',
};

export default function CandidatesPage() {
    const router = useRouter();
    const [people, setPeople] = useState<Person[]>([]);
    const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        nationalities: [] as string[],
        statuses: [] as string[],
    });
    const [showFilters, setShowFilters] = useState(false);

    const fetchPeople = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/api/v1/people/`);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            const data: Person[] = await response.json();
            setPeople(data);
            setFilteredPeople(data);
        } catch (err) {
            console.error('Failed to fetch people:', err);
            setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    }, []);

    // Apply filters and search
    useEffect(() => {
        let result = [...people];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.names.full_name?.toLowerCase().includes(query) ||
                p.contact_info?.email?.toLowerCase().includes(query) ||
                (p.demographics?.nationality || p.nationality || '').toLowerCase().includes(query)
            );
        }

        // Nationality filter
        if (filters.nationalities.length > 0) {
            result = result.filter(p => {
                const nat = (p.demographics?.nationality || p.nationality || '').toLowerCase();
                return filters.nationalities.some(f => nat.includes(f.toLowerCase()));
            });
        }

        // Status filter
        if (filters.statuses.length > 0) {
            result = result.filter(p => filters.statuses.includes(p.current_status));
        }

        setFilteredPeople(result);
    }, [people, searchQuery, filters]);

    useEffect(() => {
        fetchPeople();
    }, [fetchPeople]);

    const toggleNationality = (nat: string) => {
        setFilters(prev => ({
            ...prev,
            nationalities: prev.nationalities.includes(nat)
                ? prev.nationalities.filter(n => n !== nat)
                : [...prev.nationalities, nat]
        }));
    };

    const toggleStatus = (status: string) => {
        setFilters(prev => ({
            ...prev,
            statuses: prev.statuses.includes(status)
                ? prev.statuses.filter(s => s !== status)
                : [...prev.statuses, status]
        }));
    };

    const clearFilters = () => {
        setFilters({ nationalities: [], statuses: [] });
        setSearchQuery('');
    };

    const activeFilterCount = filters.nationalities.length + filters.statuses.length;

    // Calculate days until visa expiry
    const getDaysUntilExpiry = (expiryDate?: string): number | null => {
        if (!expiryDate) return null;
        const expiry = new Date(expiryDate);
        const today = new Date();
        const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    // Format date
    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    if (error) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">エラーが発生しました</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={fetchPeople}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        再試行
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">人材管理</h1>
                    <p className="text-gray-500 mt-1">特定技能人材のデータベース（{people.length}名登録）</p>
                </div>
                <button className="btn btn-primary">
                    + 新規人材登録
                </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="card p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="名前、メール、国籍で検索..."
                            className="input pl-10"
                        />
                    </div>

                    {/* Filter Button */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={clsx(
                                "btn flex items-center gap-2",
                                showFilters || activeFilterCount > 0
                                    ? "btn-primary"
                                    : "btn-secondary"
                            )}
                        >
                            <Filter className="w-4 h-4" />
                            フィルター
                            {activeFilterCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={fetchPeople}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
                        </button>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 animate-slideUp">
                        {/* Nationality Filter */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                                国籍
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {['indonesia', 'vietnam', 'philippines', 'myanmar', 'china'].map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => toggleNationality(key)}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                            filters.nationalities.includes(key)
                                                ? "bg-blue-100 text-blue-700 border border-blue-300"
                                                : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                                        )}
                                    >
                                        {nationalityLabels[key] || key}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                                ステータス
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(statusLabels).map(([key, { label }]) => (
                                    <button
                                        key={key}
                                        onClick={() => toggleStatus(key)}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                            filters.statuses.includes(key)
                                                ? "bg-blue-100 text-blue-700 border border-blue-300"
                                                : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                                        )}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Clear Filters */}
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                                <X className="w-4 h-4" />
                                フィルターをクリア
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Results Info */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                    <span className="font-semibold text-gray-900">{filteredPeople.length}</span> 件の人材
                    {filteredPeople.length !== people.length && (
                        <span className="text-gray-400 ml-1">（全{people.length}件中）</span>
                    )}
                </span>
            </div>

            {/* Candidate Table */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">データを読み込み中...</p>
                    </div>
                </div>
            ) : filteredPeople.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">人材が見つかりません</h3>
                    <p className="text-gray-500 mb-4">検索条件を変更してみてください</p>
                    <button onClick={clearFilters} className="btn btn-secondary">
                        フィルターをクリア
                    </button>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>名前</th>
                                <th>国籍</th>
                                <th>在留資格</th>
                                <th>ステータス</th>
                                <th>ビザ期限</th>
                                <th>メール</th>
                                <th className="text-right">アクション</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPeople.map((person) => {
                                const daysUntil = getDaysUntilExpiry(person.visa_expiry_date);
                                const nationality = person.demographics?.nationality || person.nationality || '';
                                const statusInfo = statusLabels[person.current_status] || { label: person.current_status, color: 'neutral' };

                                return (
                                    <tr
                                        key={person.person_id}
                                        className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => router.push(`/candidates/${person.person_id}`)}
                                    >
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-700 font-semibold text-sm">
                                                        {(person.names.full_name || '?').charAt(0)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{person.names.full_name}</div>
                                                    {person.names.full_name_kana && (
                                                        <div className="text-xs text-gray-500">{person.names.full_name_kana}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-neutral">
                                                {nationalityLabels[nationality.toLowerCase()] || nationality || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-sm text-gray-700">
                                                {visaLabels[person.current_visa_type || ''] || person.current_visa_type || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={clsx(
                                                "badge",
                                                statusInfo.color === 'success' && "badge-success",
                                                statusInfo.color === 'warning' && "badge-warning",
                                                statusInfo.color === 'danger' && "badge-danger",
                                                statusInfo.color === 'info' && "bg-blue-100 text-blue-700",
                                                statusInfo.color === 'neutral' && "badge-neutral"
                                            )}>
                                                {statusInfo.label}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                {person.visa_expiry_date ? (
                                                    <>
                                                        <div className="text-gray-700">{formatDate(person.visa_expiry_date)}</div>
                                                        {daysUntil !== null && daysUntil <= 90 && (
                                                            <div className={clsx(
                                                                "text-xs font-medium",
                                                                daysUntil <= 30 ? "text-red-600" : "text-amber-600"
                                                            )}>
                                                                {daysUntil <= 0 ? '期限切れ' : `残り${daysUntil}日`}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-sm text-gray-600">
                                                {person.contact_info?.email || '-'}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); }}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                                                    title="電話"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/candidates/${person.person_id}`); }}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                                                    title="詳細"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); }}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                                                    title="書類"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Data Source Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                        <p className="text-sm font-medium text-blue-900">
                            データソース: 本番API
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
