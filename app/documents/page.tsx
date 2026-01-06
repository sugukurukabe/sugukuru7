"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search,
    Filter,
    AlertTriangle,
    Upload,
    ChevronRight,
    User,
    FileText,
    FolderOpen,
    Clock,
    CheckCircle2,
    XCircle,
    Download,
    Eye,
    Plus
} from 'lucide-react';
import { clsx } from 'clsx';

interface PersonDocument {
    id: string;
    name: string;
    visa: string;
    country: string;
    completionRate: number;
    missingCount: number;
    expiringCount: number;
    documents: {
        name: string;
        status: 'complete' | 'missing' | 'expiring';
        expiryDate?: string;
    }[];
}

interface DocumentCategory {
    id: string;
    name: string;
    description: string;
    totalCount: number;
    completeCount: number;
}

export default function DocumentsPage() {
    const [people, setPeople] = useState<PersonDocument[]>([]);
    const [categories, setCategories] = useState<DocumentCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'people' | 'categories'>('people');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Try to fetch from API
                const response = await fetch('http://localhost:8000/api/v1/candidates/search?limit=20');
                if (response.ok) {
                    const data = await response.json();
                    // Transform candidate data to document format
                    const transformedPeople = data.results.map((c: any, idx: number) => ({
                        id: c.personId,
                        name: c.fullName || `人材 ${idx + 1}`,
                        visa: c.visaTypeName || c.visaType || '特定技能',
                        country: c.nationalityName || 'ベトナム',
                        completionRate: Math.floor(70 + Math.random() * 30),
                        missingCount: Math.floor(Math.random() * 3),
                        expiringCount: Math.floor(Math.random() * 2),
                        documents: []
                    }));
                    setPeople(transformedPeople);
                } else {
                    setPeople(mockPeople);
                }
            } catch (error) {
                console.error('Failed to fetch:', error);
                setPeople(mockPeople);
            }

            // Set categories (mock for now)
            setCategories([
                { id: '1', name: '在留カード', description: '在留カードのコピー', totalCount: 48, completeCount: 45 },
                { id: '2', name: 'パスポート', description: '旅券のコピー', totalCount: 48, completeCount: 48 },
                { id: '3', name: '雇用契約書', description: '雇用条件明示書', totalCount: 48, completeCount: 42 },
                { id: '4', name: '特定技能評価試験', description: '合格証明書', totalCount: 48, completeCount: 38 },
                { id: '5', name: '日本語能力試験', description: 'N4以上の証明', totalCount: 48, completeCount: 44 },
                { id: '6', name: '健康診断書', description: '年1回の健康診断', totalCount: 48, completeCount: 36 },
            ]);

            setLoading(false);
        };

        fetchData();
    }, []);

    const mockPeople: PersonDocument[] = [
        { id: '1', name: 'NGUYEN VAN A', visa: '特定技能1号', country: 'ベトナム', completionRate: 77.8, missingCount: 2, expiringCount: 1, documents: [] },
        { id: '2', name: 'TRAN THI B', visa: '特定技能1号', country: 'ベトナム', completionRate: 88.9, missingCount: 1, expiringCount: 0, documents: [] },
        { id: '3', name: 'GARCIA MARIA', visa: '特定技能1号', country: 'フィリピン', completionRate: 100, missingCount: 0, expiringCount: 2, documents: [] },
        { id: '4', name: 'PHAM VAN C', visa: '特定技能1号', country: 'ベトナム', completionRate: 66.7, missingCount: 3, expiringCount: 0, documents: [] },
    ];

    const filteredPeople = people.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        critical: people.filter(p => p.missingCount > 0).length,
        warning: people.filter(p => p.expiringCount > 0 && p.missingCount === 0).length,
        complete: people.filter(p => p.completionRate === 100).length,
    };

    const getCompletionColor = (rate: number) => {
        if (rate >= 100) return 'text-green-600 bg-green-500';
        if (rate >= 80) return 'text-blue-600 bg-blue-500';
        if (rate >= 60) return 'text-amber-600 bg-amber-500';
        return 'text-red-600 bg-red-500';
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">ドキュメント</h1>
                    <p className="text-gray-500 mt-1">契約書・申請書類の保管と管理</p>
                </div>
                <button className="btn btn-primary">
                    <Upload className="w-4 h-4 mr-2" />
                    新規アップロード
                </button>
            </div>

            {/* Alert Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={clsx(
                    "card p-4 flex items-center gap-4",
                    stats.critical > 0 && "border-red-200 bg-red-50"
                )}>
                    <div className={clsx(
                        "p-3 rounded-xl",
                        stats.critical > 0 ? "bg-red-100" : "bg-gray-100"
                    )}>
                        <XCircle className={clsx("w-6 h-6", stats.critical > 0 ? "text-red-600" : "text-gray-400")} />
                    </div>
                    <div>
                        <div className={clsx("text-2xl font-bold", stats.critical > 0 ? "text-red-600" : "text-gray-900")}>
                            {stats.critical}
                        </div>
                        <div className="text-sm text-gray-500">書類不足あり</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-xl">
                        <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{stats.warning}</div>
                        <div className="text-sm text-gray-500">期限切れ近い</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{stats.complete}</div>
                        <div className="text-sm text-gray-500">書類完備</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-3">
                <button
                    onClick={() => setActiveTab('people')}
                    className={clsx(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        activeTab === 'people'
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-600 hover:bg-gray-100"
                    )}
                >
                    人材別
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={clsx(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        activeTab === 'categories'
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-600 hover:bg-gray-100"
                    )}
                >
                    書類種別
                </button>
            </div>

            {/* Search */}
            <div className="card p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="人材名、書類名で検索..."
                            className="input pl-10"
                        />
                    </div>
                    <button className="btn btn-secondary">
                        <Filter className="w-4 h-4 mr-2" />
                        フィルター
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : activeTab === 'people' ? (
                <div className="space-y-3">
                    {filteredPeople.map((person) => (
                        <Link
                            href={`/documents/person/${person.id}`}
                            key={person.id}
                            className="card p-5 hover:shadow-md transition-shadow cursor-pointer block"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <span className="text-blue-700 font-bold text-lg">
                                            {person.name.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{person.name}</h3>
                                        <p className="text-sm text-gray-500">{person.visa} • {person.country}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {/* Completion Rate */}
                                    <div className="w-32">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-500">充足率</span>
                                            <span className={clsx("font-semibold", getCompletionColor(person.completionRate).split(' ')[0])}>
                                                {person.completionRate.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={clsx("h-full rounded-full transition-all", getCompletionColor(person.completionRate).split(' ')[1])}
                                                style={{ width: `${person.completionRate}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Status Badges */}
                                    <div className="flex gap-2">
                                        {person.missingCount > 0 && (
                                            <span className="badge badge-error">
                                                不足 {person.missingCount}
                                            </span>
                                        )}
                                        {person.expiringCount > 0 && (
                                            <span className="badge badge-warning">
                                                期限近 {person.expiringCount}
                                            </span>
                                        )}
                                        {person.completionRate === 100 && (
                                            <span className="badge badge-success">
                                                完備
                                            </span>
                                        )}
                                    </div>

                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                        </Link>
                    ))}

                    {filteredPeople.length === 0 && (
                        <div className="card p-12 text-center">
                            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">該当する人材がありません</h3>
                            <p className="text-gray-500">検索条件を変更してください</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                        <div key={cat.id} className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gray-100 rounded-xl">
                                    <FileText className="w-6 h-6 text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                                    <p className="text-sm text-gray-500 mb-3">{cat.description}</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">
                                            {cat.completeCount}/{cat.totalCount} 完了
                                        </span>
                                        <span className={clsx(
                                            "font-semibold",
                                            cat.completeCount === cat.totalCount ? "text-green-600" : "text-amber-600"
                                        )}>
                                            {((cat.completeCount / cat.totalCount) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                                        <div
                                            className={clsx(
                                                "h-full rounded-full",
                                                cat.completeCount === cat.totalCount ? "bg-green-500" : "bg-amber-500"
                                            )}
                                            style={{ width: `${(cat.completeCount / cat.totalCount) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
