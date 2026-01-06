"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Candidate, CandidateSearchResponse } from '../../types/candidates';
import {
    Search,
    Filter,
    SlidersHorizontal,
    Phone,
    Eye,
    FileText,
    ChevronDown,
    X,
    RefreshCw,
    Users
} from 'lucide-react';
import { clsx } from 'clsx';

const nationalityLabels: Record<string, string> = {
    vietnam: 'ベトナム',
    indonesia: 'インドネシア',
    philippines: 'フィリピン',
    myanmar: 'ミャンマー',
    china: '中国',
    cambodia: 'カンボジア',
    nepal: 'ネパール',
    other: 'その他',
};

const visaLabels: Record<string, string> = {
    tokutei_gino_1: '特定技能1号',
    tokutei_gino_2: '特定技能2号',
    gino_jisshu_1: '技能実習1号',
    gino_jisshu_2: '技能実習2号',
    gino_jisshu_3: '技能実習3号',
    other: 'その他',
};

export default function CandidatesPage() {
    const router = useRouter();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        nationalities: [] as string[],
        visaTypes: [] as string[],
    });
    const [showFilters, setShowFilters] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    const fetchCandidates = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('keyword', searchQuery);
            filters.nationalities.forEach(v => params.append('nationalities', v));
            filters.visaTypes.forEach(v => params.append('visa_types', v));

            const response = await fetch(`http://localhost:8000/api/v1/candidates/search?${params.toString()}`);
            if (response.ok) {
                const data: CandidateSearchResponse = await response.json();
                setCandidates(data.results);
                setTotalCount(data.results.length);
            }
        } catch (error) {
            console.error('Failed to fetch candidates:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCandidates();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchCandidates]);

    const toggleNationality = (nat: string) => {
        setFilters(prev => ({
            ...prev,
            nationalities: prev.nationalities.includes(nat)
                ? prev.nationalities.filter(n => n !== nat)
                : [...prev.nationalities, nat]
        }));
    };

    const toggleVisaType = (visa: string) => {
        setFilters(prev => ({
            ...prev,
            visaTypes: prev.visaTypes.includes(visa)
                ? prev.visaTypes.filter(v => v !== visa)
                : [...prev.visaTypes, visa]
        }));
    };

    const clearFilters = () => {
        setFilters({ nationalities: [], visaTypes: [] });
        setSearchQuery('');
    };

    const activeFilterCount = filters.nationalities.length + filters.visaTypes.length;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">人材管理</h1>
                    <p className="text-gray-500 mt-1">特定技能人材のデータベースとスキルマッチング</p>
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
                            placeholder="名前、スキル、国籍で検索..."
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
                            onClick={fetchCandidates}
                            className="btn btn-secondary"
                        >
                            <RefreshCw className="w-4 h-4" />
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
                                {Object.entries(nationalityLabels).map(([key, label]) => (
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
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Visa Type Filter */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                                在留資格
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(visaLabels).map(([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={() => toggleVisaType(key)}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                            filters.visaTypes.includes(key)
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
                    <span className="font-semibold text-gray-900">{totalCount}</span> 件の人材
                </span>
                <select className="text-sm text-gray-600 bg-transparent border-none cursor-pointer">
                    <option>名前順</option>
                    <option>登録日順</option>
                    <option>ビザ期限順</option>
                </select>
            </div>

            {/* Candidate Table */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : candidates.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">候補者が見つかりません</h3>
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
                                <th>年齢</th>
                                <th>ステータス</th>
                                <th>ビザ期限</th>
                                <th className="text-right">アクション</th>
                            </tr>
                        </thead>
                        <tbody>
                            {candidates.map((candidate) => (
                                <tr
                                    key={candidate.personId}
                                    className="cursor-pointer"
                                    onClick={() => router.push(`/candidates/${candidate.personId}`)}
                                >
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-700 font-semibold text-sm">
                                                    {(candidate.fullName || '?').charAt(0)}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{candidate.fullName}</div>
                                                {candidate.fullNameKana && (
                                                    <div className="text-xs text-gray-500">{candidate.fullNameKana}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-neutral">
                                            {nationalityLabels[candidate.nationality] || candidate.nationality}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="text-sm text-gray-700">
                                            {visaLabels[candidate.visaType] || candidate.visaType}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="text-sm text-gray-700">
                                            {candidate.age ? `${candidate.age}歳` : '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={clsx(
                                            "badge",
                                            candidate.availability === 'available' && "badge-success",
                                            candidate.availability === 'ending_soon' && "badge-warning",
                                            candidate.availability === 'assigned' && "badge-neutral"
                                        )}>
                                            {candidate.availabilityLabel || candidate.availability}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="text-sm">
                                            {candidate.visaValidUntil ? (
                                                <>
                                                    <div className="text-gray-700">{candidate.visaValidUntil}</div>
                                                    {candidate.daysUntilVisaExpiry !== undefined && candidate.daysUntilVisaExpiry <= 90 && (
                                                        <div className={clsx(
                                                            "text-xs font-medium",
                                                            candidate.daysUntilVisaExpiry <= 30 ? "text-red-600" : "text-amber-600"
                                                        )}>
                                                            残り{candidate.daysUntilVisaExpiry}日
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </div>
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
                                                onClick={(e) => { e.stopPropagation(); router.push(`/candidates/${candidate.personId}`); }}
                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                                                title="詳細"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); }}
                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                                                title="提案書作成"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
