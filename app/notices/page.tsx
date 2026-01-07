"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheck,
    FileDown,
    CheckCircle2,
    AlertTriangle,
    Clock,
    RefreshCw,
    Plus,
    ChevronRight,
    Calendar,
    X,
    Save,
    FileText,
    User,
    Building
} from 'lucide-react';
import { clsx } from 'clsx';

// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sugukuru-api-1027796998462.asia-northeast1.run.app';

interface Notice {
    noticeId: string;
    noticeType: string;
    noticeTypeName: string;
    personId: string;
    personName: string;
    organizationName?: string;
    eventDate: string;
    deadline: string;
    daysUntilDeadline: number;
    status: 'pending' | 'generated' | 'submitted' | 'completed';
    documentUrl?: string;
    notes?: string;
    createdAt?: string;
}

interface Person {
    person_id: string;
    names: { full_name: string };
    current_status: string;
}

const noticeTypes = [
    { value: 'zuitoji_dispatch_change', label: '随時届出（派遣先変更）' },
    { value: 'zuitoji_termination', label: '随時届出（契約終了）' },
    { value: 'zuitoji_new_contract', label: '随時届出（新規契約）' },
    { value: 'quarterly_report', label: '定期届出（四半期）' },
    { value: 'annual_report', label: '定期届出（年次）' },
    { value: 'address_change', label: '届出（住所変更）' },
    { value: 'employment_start', label: '届出（雇用開始）' },
    { value: 'employment_end', label: '届出（雇用終了）' },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: '作成待ち', color: 'bg-gray-100 text-gray-700', icon: <Clock className="w-4 h-4" /> },
    generated: { label: '作成済み', color: 'bg-blue-100 text-blue-700', icon: <FileDown className="w-4 h-4" /> },
    submitted: { label: '提出済み', color: 'bg-amber-100 text-amber-700', icon: <CheckCircle2 className="w-4 h-4" /> },
    completed: { label: '完了', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-4 h-4" /> },
};

export default function NoticesPage() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'urgent' | 'pending'>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // New notice form
    const [newNotice, setNewNotice] = useState({
        noticeType: 'zuitoji_dispatch_change',
        personId: '',
        eventDate: '',
        notes: '',
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch people for the dropdown
            const peopleResponse = await fetch(`${API_BASE}/api/v1/people/`);
            if (peopleResponse.ok) {
                const peopleData = await peopleResponse.json();
                setPeople(peopleData);
            }

            // Try to fetch notices from API
            const response = await fetch(`${API_BASE}/api/v1/notices`);
            if (response.ok) {
                const data = await response.json();
                setNotices(data.notices || []);
            } else {
                // API not available - start with empty
                setNotices([]);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setNotices([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateNotice = async () => {
        if (!newNotice.personId || !newNotice.eventDate) {
            alert('人材と発生日を選択してください');
            return;
        }

        setSaving(true);
        try {
            const selectedPerson = people.find(p => p.person_id === newNotice.personId);
            const selectedType = noticeTypes.find(t => t.value === newNotice.noticeType);

            // Calculate deadline (14 days from event date)
            const eventDate = new Date(newNotice.eventDate);
            const deadline = new Date(eventDate);
            deadline.setDate(deadline.getDate() + 14);

            const today = new Date();
            const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            const newNoticeData: Notice = {
                noticeId: `notice-${Date.now()}`,
                noticeType: newNotice.noticeType,
                noticeTypeName: selectedType?.label || newNotice.noticeType,
                personId: newNotice.personId,
                personName: selectedPerson?.names.full_name || '不明',
                eventDate: newNotice.eventDate,
                deadline: deadline.toISOString().split('T')[0],
                daysUntilDeadline: daysUntil,
                status: 'pending',
                notes: newNotice.notes,
                createdAt: new Date().toISOString(),
            };

            // Add to local state (in production, this would POST to API)
            setNotices(prev => [newNoticeData, ...prev]);

            setShowCreateModal(false);
            setNewNotice({
                noticeType: 'zuitoji_dispatch_change',
                personId: '',
                eventDate: '',
                notes: '',
            });

            setSuccessMessage('届出を作成しました');
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (err) {
            console.error('Failed to create notice:', err);
            alert('作成に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateDocument = (noticeId: string) => {
        // Update status to generated
        setNotices(prev => prev.map(n =>
            n.noticeId === noticeId
                ? { ...n, status: 'generated' as const, documentUrl: `/documents/notice-${noticeId}.pdf` }
                : n
        ));
        setSuccessMessage('書類を生成しました');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const handleMarkSubmitted = (noticeId: string) => {
        setNotices(prev => prev.map(n =>
            n.noticeId === noticeId
                ? { ...n, status: 'submitted' as const }
                : n
        ));
        setSuccessMessage('提出済みにしました');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const handleMarkCompleted = (noticeId: string) => {
        setNotices(prev => prev.map(n =>
            n.noticeId === noticeId
                ? { ...n, status: 'completed' as const }
                : n
        ));
        setSuccessMessage('完了にしました');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const handleDownload = (notice: Notice) => {
        // In production, this would download a real PDF
        const content = `
入管届出書類

届出種類: ${notice.noticeTypeName}
対象者: ${notice.personName}
発生日: ${notice.eventDate}
提出期限: ${notice.deadline}
備考: ${notice.notes || 'なし'}

作成日: ${new Date().toLocaleDateString('ja-JP')}
作成者: スグクル3.0システム
        `.trim();

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `届出_${notice.noticeTypeName}_${notice.personName}_${notice.eventDate}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const filteredNotices = notices.filter(n => {
        if (filter === 'urgent') return n.daysUntilDeadline <= 7;
        if (filter === 'pending') return n.status === 'pending';
        return true;
    });

    const stats = {
        urgent: notices.filter(n => n.daysUntilDeadline <= 3).length,
        pending: notices.filter(n => n.status === 'pending').length,
        generated: notices.filter(n => n.status === 'generated').length,
        completed: notices.filter(n => n.status === 'completed' || n.status === 'submitted').length,
    };

    const getDeadlineColor = (days: number) => {
        if (days <= 3) return 'text-red-600 bg-red-50';
        if (days <= 7) return 'text-amber-600 bg-amber-50';
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Success Message */}
            {successMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fadeIn flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    {successMessage}
                </div>
            )}

            {/* Create Notice Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">新規届出作成</h2>
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
                                    届出種類 <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newNotice.noticeType}
                                    onChange={(e) => setNewNotice({ ...newNotice, noticeType: e.target.value })}
                                    className="input w-full"
                                >
                                    {noticeTypes.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    対象者 <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newNotice.personId}
                                    onChange={(e) => setNewNotice({ ...newNotice, personId: e.target.value })}
                                    className="input w-full"
                                >
                                    <option value="">人材を選択してください</option>
                                    {people.map(person => (
                                        <option key={person.person_id} value={person.person_id}>
                                            {person.names.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    発生日 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={newNotice.eventDate}
                                    onChange={(e) => setNewNotice({ ...newNotice, eventDate: e.target.value })}
                                    className="input w-full"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    提出期限は発生日から14日後に自動設定されます
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    備考
                                </label>
                                <textarea
                                    value={newNotice.notes}
                                    onChange={(e) => setNewNotice({ ...newNotice, notes: e.target.value })}
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
                                onClick={handleCreateNotice}
                                className="btn btn-primary flex items-center gap-2"
                                disabled={saving || !newNotice.personId || !newNotice.eventDate}
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
                    <h1 className="text-2xl font-bold text-gray-900">入管届出</h1>
                    <p className="text-gray-500 mt-1">届出書類の自動生成と期限管理</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-primary"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        新規届出作成
                    </button>
                </div>
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
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">データを読み込み中...</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredNotices.map((notice) => (
                        <div
                            key={notice.noticeId}
                            className="card p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 flex-wrap">
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
                                        <span className="inline-flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {notice.personName}
                                        </span>
                                        <span className="mx-2">•</span>
                                        発生日: {notice.eventDate}
                                    </p>
                                    {notice.notes && (
                                        <p className="text-sm text-gray-400 italic">備考: {notice.notes}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    {notice.status === 'pending' && (
                                        <button
                                            onClick={() => handleGenerateDocument(notice.noticeId)}
                                            className="btn btn-primary text-sm"
                                        >
                                            <FileText className="w-4 h-4 mr-1" />
                                            書類を生成
                                        </button>
                                    )}
                                    {notice.status === 'generated' && (
                                        <>
                                            <button
                                                onClick={() => handleDownload(notice)}
                                                className="btn btn-primary text-sm"
                                            >
                                                <FileDown className="w-4 h-4 mr-1" />
                                                ダウンロード
                                            </button>
                                            <button
                                                onClick={() => handleMarkSubmitted(notice.noticeId)}
                                                className="btn btn-secondary text-sm"
                                            >
                                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                                提出済み
                                            </button>
                                        </>
                                    )}
                                    {notice.status === 'submitted' && (
                                        <button
                                            onClick={() => handleMarkCompleted(notice.noticeId)}
                                            className="btn btn-success text-sm bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-1" />
                                            完了にする
                                        </button>
                                    )}
                                    {notice.status === 'completed' && (
                                        <span className="text-green-600 font-medium text-sm flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4" />
                                            完了済み
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredNotices.length === 0 && (
                        <div className="card p-12 text-center">
                            <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">届出はありません</h3>
                            <p className="text-gray-500 mb-4">現在対応が必要な届出はありません</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn btn-primary mx-auto flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                新規届出作成
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Info Card */}
            <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="p-5">
                    <h3 className="font-semibold text-gray-900 mb-2">📋 入管届出について</h3>
                    <p className="text-sm text-gray-600">
                        特定技能外国人の受入れに関する届出は、事由発生日から14日以内に行う必要があります。
                        このシステムでは届出書類の自動生成と期限管理を行い、提出漏れを防止します。
                    </p>
                </div>
            </div>
        </div>
    );
}
