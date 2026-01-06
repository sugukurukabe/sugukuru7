"use client";
import React, { useState, useEffect } from 'react';
import {
    ShieldCheck,
    FileDown,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Filter,
    RefreshCw,
    Plus,
    ChevronRight,
    Calendar
} from 'lucide-react';
import { clsx } from 'clsx';

interface Notice {
    noticeId: string;
    noticeType: string;
    noticeTypeName: string;
    personId: string;
    personName: string;
    eventDate: string;
    deadline: string;
    daysUntilDeadline: number;
    status: 'pending' | 'generated' | 'submitted' | 'completed';
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: '作成待ち', color: 'bg-gray-100 text-gray-700', icon: <Clock className="w-4 h-4" /> },
    generated: { label: '作成済み', color: 'bg-blue-100 text-blue-700', icon: <FileDown className="w-4 h-4" /> },
    submitted: { label: '提出済み', color: 'bg-amber-100 text-amber-700', icon: <CheckCircle2 className="w-4 h-4" /> },
    completed: { label: '完了', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-4 h-4" /> },
};

export default function NoticesPage() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'urgent' | 'pending'>('all');

    useEffect(() => {
        const fetchNotices = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://localhost:8000/api/v1/notices');
                if (response.ok) {
                    const data = await response.json();
                    setNotices(data.notices || []);
                } else {
                    setNotices(mockNotices);
                }
            } catch (error) {
                console.error('Failed to fetch notices:', error);
                setNotices(mockNotices);
            } finally {
                setLoading(false);
            }
        };
        fetchNotices();
    }, []);

    const mockNotices: Notice[] = [
        {
            noticeId: '1',
            noticeType: 'zuitoji_dispatch_change',
            noticeTypeName: '随時届出（派遣先変更）',
            personId: 'p1',
            personName: 'NGUYEN VAN A',
            eventDate: '2025-01-15',
            deadline: '2025-01-29',
            daysUntilDeadline: 2,
            status: 'generated'
        },
        {
            noticeId: '2',
            noticeType: 'zuitoji_termination',
            noticeTypeName: '随時届出（契約終了）',
            personId: 'p2',
            personName: 'TRAN THI B',
            eventDate: '2025-01-20',
            deadline: '2025-02-03',
            daysUntilDeadline: 7,
            status: 'pending'
        },
        {
            noticeId: '3',
            noticeType: 'quarterly_report',
            noticeTypeName: '定期届出（四半期）',
            personId: 'p3',
            personName: 'GARCIA',
            eventDate: '2025-01-01',
            deadline: '2025-01-31',
            daysUntilDeadline: 4,
            status: 'submitted'
        }
    ];

    const filteredNotices = notices.filter(n => {
        if (filter === 'urgent') return n.daysUntilDeadline <= 7;
        if (filter === 'pending') return n.status === 'pending';
        return true;
    });

    const stats = {
        urgent: notices.filter(n => n.daysUntilDeadline <= 3).length,
        pending: notices.filter(n => n.status === 'pending').length,
        generated: notices.filter(n => n.status === 'generated').length,
        completed: notices.filter(n => n.status === 'completed').length,
    };

    const getDeadlineColor = (days: number) => {
        if (days <= 3) return 'text-red-600 bg-red-50';
        if (days <= 7) return 'text-amber-600 bg-amber-50';
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">入管届出</h1>
                    <p className="text-gray-500 mt-1">届出書類の自動生成と期限管理</p>
                </div>
                <button className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    手動届出生成
                </button>
            </div>

            {/* Alert Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={clsx(
                    "card p-4 flex items-center gap-4",
                    stats.urgent > 0 && "border-red-200 bg-red-50"
                )}>
                    <div className={clsx(
                        "p-3 rounded-xl",
                        stats.urgent > 0 ? "bg-red-100" : "bg-gray-100"
                    )}>
                        <AlertTriangle className={clsx("w-6 h-6", stats.urgent > 0 ? "text-red-600" : "text-gray-400")} />
                    </div>
                    <div>
                        <div className={clsx("text-2xl font-bold", stats.urgent > 0 ? "text-red-600" : "text-gray-900")}>
                            {stats.urgent}
                        </div>
                        <div className="text-sm text-gray-500">緊急（3日以内）</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-xl">
                        <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
                        <div className="text-sm text-gray-500">作成待ち</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                        <FileDown className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{stats.generated}</div>
                        <div className="text-sm text-gray-500">作成済み</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
                        <div className="text-sm text-gray-500">完了</div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {[
                    { key: 'all', label: 'すべて' },
                    { key: 'urgent', label: '期限近い' },
                    { key: 'pending', label: '作成待ち' },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key as any)}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            filter === tab.key
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Notices List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredNotices.map((notice) => (
                        <div
                            key={notice.noticeId}
                            className="card p-5 hover:shadow-md transition-shadow cursor-pointer"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className={clsx(
                                            "px-2 py-1 rounded text-xs font-semibold",
                                            getDeadlineColor(notice.daysUntilDeadline)
                                        )}>
                                            期限: {notice.deadline}（残り{notice.daysUntilDeadline}日）
                                        </span>
                                        <span className={clsx(
                                            "px-2 py-1 rounded text-xs font-semibold flex items-center gap-1",
                                            statusConfig[notice.status].color
                                        )}>
                                            {statusConfig[notice.status].icon}
                                            {statusConfig[notice.status].label}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">{notice.noticeTypeName}</h3>
                                    <p className="text-sm text-gray-500">
                                        {notice.personName} • 発生日: {notice.eventDate}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {notice.status === 'generated' && (
                                        <button className="btn btn-primary text-sm">
                                            <FileDown className="w-4 h-4 mr-1" />
                                            ダウンロード
                                        </button>
                                    )}
                                    {notice.status === 'generated' && (
                                        <button className="btn btn-secondary text-sm">
                                            <CheckCircle2 className="w-4 h-4 mr-1" />
                                            提出済み
                                        </button>
                                    )}
                                    {notice.status === 'pending' && (
                                        <button className="btn btn-primary text-sm">
                                            書類を生成
                                        </button>
                                    )}
                                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredNotices.length === 0 && (
                        <div className="card p-12 text-center">
                            <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">届出はありません</h3>
                            <p className="text-gray-500">現在対応が必要な届出はありません</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
