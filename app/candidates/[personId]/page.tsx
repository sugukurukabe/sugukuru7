"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    MapPin,
    Briefcase,
    Calendar,
    Phone,
    Mail,
    Clock,
    FileText,
    RefreshCw,
    AlertTriangle,
    User,
    Building,
    CreditCard
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
        address?: string;
    };
    current_status: string;
    current_status_notes?: string;
    nationality?: string;
    current_visa_type?: string;
    visa_expiry_date?: string;
    date_of_birth?: string;
    smarthr_crew_id?: string;
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
};

const statusLabels: Record<string, { label: string; color: string }> = {
    monitoring: { label: '管理中', color: 'success' },
    applying: { label: '申請中', color: 'warning' },
    preparing: { label: '準備中', color: 'info' },
    resigned: { label: '退職済み', color: 'danger' },
    lost: { label: '失注', color: 'neutral' },
    hold: { label: '保留', color: 'neutral' },
};

export default function CandidateDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [person, setPerson] = useState<Person | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPerson = async () => {
        if (!params?.personId) return;

        setLoading(true);
        setError(null);

        try {
            // First try to get from people list and find by ID
            const response = await fetch(`${API_BASE}/api/v1/people/`);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            const people: Person[] = await response.json();
            const found = people.find(p => p.person_id === params.personId);

            if (found) {
                setPerson(found);
            } else {
                setError('人材が見つかりませんでした');
            }
        } catch (err) {
            console.error('Failed to fetch person:', err);
            setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPerson();
    }, [params?.personId]);

    // Calculate age from date of birth
    const calculateAge = (dob?: string): number | null => {
        if (!dob) return null;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

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

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">データを読み込み中...</p>
                </div>
            </div>
        );
    }

    if (error || !person) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                        {error || '人材が見つかりませんでした'}
                    </h2>
                    <p className="text-gray-600 mb-4">ID: {params?.personId}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                        >
                            戻る
                        </button>
                        <button
                            onClick={fetchPerson}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            再試行
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const nationality = person.demographics?.nationality || person.nationality || '';
    const statusInfo = statusLabels[person.current_status] || { label: person.current_status, color: 'neutral' };
    const age = calculateAge(person.date_of_birth || person.demographics?.date_of_birth);
    const daysUntilExpiry = getDaysUntilExpiry(person.visa_expiry_date);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Back Navigation */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">人材詳細</h1>
                    <p className="text-gray-500 text-sm">プロファイル情報</p>
                </div>
            </div>

            {/* Profile Header Card */}
            <div className="card p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center">
                            <span className="text-3xl font-bold text-blue-600">
                                {person.names.full_name?.charAt(0) || '?'}
                            </span>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {person.names.full_name}
                                </h2>
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
                            </div>
                            {person.names.full_name_kana && (
                                <p className="text-gray-500 mt-1">{person.names.full_name_kana}</p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="w-4 h-4" />
                                <span>{nationalityLabels[nationality.toLowerCase()] || nationality || '未設定'}</span>
                            </div>
                            {age && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <User className="w-4 h-4" />
                                    <span>{age}歳</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-600">
                                <FileText className="w-4 h-4" />
                                <span>{person.current_visa_type || '在留資格未設定'}</span>
                            </div>
                        </div>

                        {/* Contact Buttons */}
                        <div className="flex gap-3 pt-2">
                            {person.contact_info?.phone && (
                                <a
                                    href={`tel:${person.contact_info.phone}`}
                                    className="btn btn-secondary flex items-center gap-2"
                                >
                                    <Phone className="w-4 h-4" />
                                    電話
                                </a>
                            )}
                            {person.contact_info?.email && (
                                <a
                                    href={`mailto:${person.contact_info.email}`}
                                    className="btn btn-secondary flex items-center gap-2"
                                >
                                    <Mail className="w-4 h-4" />
                                    メール
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visa Status Card */}
                <div className="card p-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                        在留ステータス
                    </h3>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">在留資格</span>
                            <span className="font-semibold">{person.current_visa_type || '-'}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">期限日</span>
                            <span className="font-semibold">{formatDate(person.visa_expiry_date)}</span>
                        </div>

                        {daysUntilExpiry !== null && (
                            <div className="pt-2">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600">残り日数</span>
                                    <span className={clsx(
                                        "font-bold",
                                        daysUntilExpiry <= 30 ? "text-red-600" :
                                            daysUntilExpiry <= 90 ? "text-amber-600" : "text-green-600"
                                    )}>
                                        {daysUntilExpiry <= 0 ? '期限切れ' : `${daysUntilExpiry}日`}
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={clsx(
                                            "h-full rounded-full transition-all",
                                            daysUntilExpiry <= 30 ? "bg-red-500" :
                                                daysUntilExpiry <= 90 ? "bg-amber-500" : "bg-green-500"
                                        )}
                                        style={{ width: `${Math.min(100, Math.max(0, daysUntilExpiry / 365 * 100))}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contact Info Card */}
                <div className="card p-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                        連絡先情報
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Mail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">メールアドレス</p>
                                <p className="font-medium">{person.contact_info?.email || '-'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Phone className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">電話番号</p>
                                <p className="font-medium">{person.contact_info?.phone || '-'}</p>
                            </div>
                        </div>

                        {person.smarthr_crew_id && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">SmartHR ID</p>
                                    <p className="font-medium">{person.smarthr_crew_id}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Notes */}
            {person.current_status_notes && (
                <div className="card p-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                        ステータスメモ
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{person.current_status_notes}</p>
                </div>
            )}

            {/* Metadata */}
            <div className="card p-6 bg-gray-50">
                <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                    <div>
                        <span className="text-gray-400">登録日:</span>{' '}
                        <span>{formatDate(person.created_at)}</span>
                    </div>
                    <div>
                        <span className="text-gray-400">更新日:</span>{' '}
                        <span>{formatDate(person.updated_at)}</span>
                    </div>
                    <div>
                        <span className="text-gray-400">ID:</span>{' '}
                        <span className="font-mono text-xs">{person.person_id}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-4">
                <button
                    onClick={() => router.back()}
                    className="btn btn-secondary"
                >
                    <ChevronLeft className="w-4 h-4" />
                    一覧に戻る
                </button>
                <button className="btn btn-primary">
                    編集
                </button>
            </div>
        </div>
    );
}
