"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    MapPin,
    Phone,
    Mail,
    Clock,
    FileText,
    RefreshCw,
    AlertTriangle,
    User,
    CreditCard,
    X,
    Save,
    Pencil
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

const nationalityOptions = [
    { value: 'indonesia', label: 'インドネシア' },
    { value: 'vietnam', label: 'ベトナム' },
    { value: 'philippines', label: 'フィリピン' },
    { value: 'myanmar', label: 'ミャンマー' },
    { value: 'china', label: '中国' },
    { value: 'cambodia', label: 'カンボジア' },
    { value: 'nepal', label: 'ネパール' },
    { value: 'thailand', label: 'タイ' },
];

const statusOptions = [
    { value: 'monitoring', label: '管理中' },
    { value: 'applying', label: '申請中' },
    { value: 'preparing', label: '準備中' },
    { value: 'resigned', label: '退職済み' },
    { value: 'lost', label: '失注' },
    { value: 'hold', label: '保留' },
];

const visaOptions = [
    { value: '特定技能1号', label: '特定技能1号' },
    { value: '特定技能2号', label: '特定技能2号' },
    { value: '技能実習1号', label: '技能実習1号' },
    { value: '技能実習2号', label: '技能実習2号' },
    { value: '技能実習3号', label: '技能実習3号' },
    { value: '特定活動', label: '特定活動' },
];

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
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Edit form state
    const [editForm, setEditForm] = useState({
        full_name: '',
        full_name_kana: '',
        email: '',
        phone: '',
        nationality: '',
        current_status: '',
        current_status_notes: '',
        current_visa_type: '',
        visa_expiry_date: '',
    });

    const fetchPerson = async () => {
        if (!params?.personId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/api/v1/people/${params.personId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    setError('人材が見つかりませんでした');
                    return;
                }
                throw new Error(`API Error: ${response.status}`);
            }
            const data: Person = await response.json();
            setPerson(data);

            // Initialize edit form
            setEditForm({
                full_name: data.names.full_name || '',
                full_name_kana: data.names.full_name_kana || '',
                email: data.contact_info?.email || '',
                phone: data.contact_info?.phone || '',
                nationality: data.demographics?.nationality || data.nationality || '',
                current_status: data.current_status || 'monitoring',
                current_status_notes: data.current_status_notes || '',
                current_visa_type: data.current_visa_type || '',
                visa_expiry_date: data.visa_expiry_date ? data.visa_expiry_date.split('T')[0] : '',
            });
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

    const handleSave = async () => {
        if (!person) return;

        setSaving(true);
        setSaveSuccess(false);

        try {
            const updateData = {
                names: {
                    ...person.names,
                    full_name: editForm.full_name,
                    full_name_kana: editForm.full_name_kana,
                },
                contact_info: {
                    ...person.contact_info,
                    email: editForm.email,
                    phone: editForm.phone,
                },
                demographics: {
                    ...person.demographics,
                    nationality: editForm.nationality,
                },
                current_status: editForm.current_status,
                current_status_notes: editForm.current_status_notes,
                nationality: editForm.nationality,
                current_visa_type: editForm.current_visa_type,
                visa_expiry_date: editForm.visa_expiry_date ? new Date(editForm.visa_expiry_date).toISOString() : null,
            };

            const response = await fetch(`${API_BASE}/api/v1/people/${person.person_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                throw new Error(`Update failed: ${response.status}`);
            }

            const updatedPerson = await response.json();
            setPerson(updatedPerson);
            setIsEditing(false);
            setSaveSuccess(true);

            // Clear success message after 3 seconds
            setTimeout(() => setSaveSuccess(false), 3000);

        } catch (err) {
            console.error('Failed to save:', err);
            alert('保存に失敗しました: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

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
            {/* Success Message */}
            {saveSuccess && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fadeIn flex items-center gap-2">
                    <Save className="w-5 h-5" />
                    保存しました
                </div>
            )}

            {/* Back Navigation */}
            <div className="flex items-center justify-between">
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
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Pencil className="w-4 h-4" />
                        編集
                    </button>
                )}
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">人材情報を編集</h2>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase">基本情報</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            氏名 *
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.full_name}
                                            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                            className="input w-full"
                                            placeholder="例: NGUYEN VAN A"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            氏名（カナ）
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.full_name_kana}
                                            onChange={(e) => setEditForm({ ...editForm, full_name_kana: e.target.value })}
                                            className="input w-full"
                                            placeholder="例: グエン ヴァン アー"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        国籍
                                    </label>
                                    <select
                                        value={editForm.nationality}
                                        onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                                        className="input w-full"
                                    >
                                        <option value="">選択してください</option>
                                        {nationalityOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase">連絡先</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            メールアドレス
                                        </label>
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="input w-full"
                                            placeholder="example@email.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            電話番号
                                        </label>
                                        <input
                                            type="tel"
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            className="input w-full"
                                            placeholder="090-1234-5678"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase">ステータス</h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        現在のステータス
                                    </label>
                                    <select
                                        value={editForm.current_status}
                                        onChange={(e) => setEditForm({ ...editForm, current_status: e.target.value })}
                                        className="input w-full"
                                    >
                                        {statusOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ステータスメモ
                                    </label>
                                    <textarea
                                        value={editForm.current_status_notes}
                                        onChange={(e) => setEditForm({ ...editForm, current_status_notes: e.target.value })}
                                        className="input w-full min-h-[100px]"
                                        placeholder="備考・メモを入力..."
                                    />
                                </div>
                            </div>

                            {/* Visa Info */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase">在留資格</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            在留資格
                                        </label>
                                        <select
                                            value={editForm.current_visa_type}
                                            onChange={(e) => setEditForm({ ...editForm, current_visa_type: e.target.value })}
                                            className="input w-full"
                                        >
                                            <option value="">選択してください</option>
                                            {visaOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            在留期限
                                        </label>
                                        <input
                                            type="date"
                                            value={editForm.visa_expiry_date}
                                            onChange={(e) => setEditForm({ ...editForm, visa_expiry_date: e.target.value })}
                                            className="input w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="btn btn-secondary"
                                disabled={saving}
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn btn-primary flex items-center gap-2"
                                disabled={saving}
                            >
                                {saving ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {saving ? '保存中...' : '保存'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    className="btn btn-secondary flex items-center gap-2"
                >
                    <ChevronLeft className="w-4 h-4" />
                    一覧に戻る
                </button>
                <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Pencil className="w-4 h-4" />
                    編集
                </button>
            </div>
        </div>
    );
}
