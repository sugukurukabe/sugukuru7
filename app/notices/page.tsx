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
    Building,
    FileSpreadsheet
} from 'lucide-react';
import { clsx } from 'clsx';
import * as XLSX from 'xlsx';

// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sugukuru-api-1027796998462.asia-northeast1.run.app';

interface Notice {
    noticeId: string;
    noticeType: string;
    noticeTypeName: string;
    personId: string;
    personName: string;
    personNationality?: string;
    personVisaType?: string;
    personVisaExpiry?: string;
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
    names: { full_name: string; full_name_kana?: string };
    demographics?: { nationality?: string };
    nationality?: string;
    current_status: string;
    current_visa_type?: string;
    visa_expiry_date?: string;
    contact_info?: { email?: string; phone?: string; address?: string };
}

const noticeTypes = [
    { value: 'zuitoji_dispatch_change', label: '随時届出（派遣先変更）', code: '様式第3号-4' },
    { value: 'zuitoji_termination', label: '随時届出（契約終了）', code: '様式第3号-4' },
    { value: 'zuitoji_new_contract', label: '随時届出（新規契約）', code: '様式第3号-4' },
    { value: 'quarterly_report', label: '定期届出（四半期）', code: '様式第3号-6' },
    { value: 'annual_report', label: '定期届出（年次）', code: '様式第3号-6' },
    { value: 'address_change', label: '届出（住所変更）', code: '様式第3号-4' },
    { value: 'employment_start', label: '届出（雇用開始）', code: '様式第3号-3' },
    { value: 'employment_end', label: '届出（雇用終了）', code: '様式第3号-4' },
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
            const response = await fetch(`${API_BASE}/api/v1/notices/`);
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
                personNationality: selectedPerson?.demographics?.nationality || selectedPerson?.nationality || '',
                personVisaType: selectedPerson?.current_visa_type || '',
                personVisaExpiry: selectedPerson?.visa_expiry_date || '',
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
                ? { ...n, status: 'generated' as const, documentUrl: `/documents/notice-${noticeId}.xlsx` }
                : n
        ));
        setSuccessMessage('書類を生成しました。ダウンロードボタンでExcelファイルを取得できます。');
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

    const handleDownloadExcel = (notice: Notice) => {
        // Get selected person data
        const person = people.find(p => p.person_id === notice.personId);
        const noticeTypeInfo = noticeTypes.find(t => t.value === notice.noticeType);

        // Create Excel workbook
        const wb = XLSX.utils.book_new();

        // Parse dates for form
        const eventDateParts = notice.eventDate.split('-');
        const eventYear = eventDateParts[0] || '';
        const eventMonth = eventDateParts[1] || '';
        const eventDay = eventDateParts[2] || '';

        const today = new Date();
        const todayYear = today.getFullYear().toString();
        const todayMonth = (today.getMonth() + 1).toString();
        const todayDay = today.getDate().toString();

        // Extract person info
        const personName = person?.names.full_name || notice.personName || '';
        const personNameKana = person?.names.full_name_kana || '';
        const nationality = person?.demographics?.nationality || person?.nationality || notice.personNationality || '';
        const residenceCardNo = ''; // 在留カード番号 - to be filled
        const industryField = '農業'; // 特定産業分野
        const businessCategory = '耕種農業全般'; // 業務区分

        // ===== Sheet 1: 参考様式第3-1-1号 特定技能雇用契約の変更に係る届出書 =====
        const formData: (string | number)[][] = [
            // Row 1: Header
            ['参考様式第3-1-1号', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 2: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 3: Title
            ['', '', '', '特定技能雇用契約の変更に係る届出書', '', '', '', '', '', '', '', '', ''],
            // Row 4: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 5: 宛先
            ['', '出入国在留管理庁長官', '', '殿', '', '', '', '', '', '', '', '', ''],
            // Row 6: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 7: 法的根拠
            ['出入国管理及び難民認定法第19条の18第1項第1号の規定により、次のとおり届け出ます。', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 8: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 9: Section 1
            ['①', '届出の対象者', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 10: Name header
            ['', '氏名(ローマ字)', '', '', '', '', '', '', '', '', '性別', '男 ・ 女', ''],
            // Row 11: Name value
            ['', personName, '', '', '', '', '', '', '', '', '', '', ''],
            // Row 12: Birth date header
            ['', '生年月日', '', '', '年', '', '月', '', '日', '', '国籍・地域', '', ''],
            // Row 13: Birth date values
            ['', '', '', '', '', '', '', '', '', '', nationality, '', ''],
            // Row 14: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 15: Residence card
            ['', '在留カード番号', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 16: Card number boxes
            ['', residenceCardNo, '', '', '', '', '', '', '', '', '', '', ''],
            // Row 17: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 18: Industry field
            ['', '特定産業分野', '', '', '', '', '', '', '', '業務区分', '', '', ''],
            // Row 19: Industry values
            ['', industryField, '', '', '', '', '', '', '', businessCategory, '', '', ''],
            // Row 20: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 21: Section 2
            ['②', '特定技能雇用契約の変更内容', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 22: Change date header
            ['', 'a', '変更年月日', '', '', '', eventYear, '年', eventMonth, '月', eventDay, '日', ''],
            // Row 23: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 24: Change items header
            ['', 'b', '変更事項', '', '', '', '', '', '', '', '', '', ''],
            // Row 25: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 26: Checkbox instruction
            ['', '', '①変更した内容に該当する事項を以下の中から選択してください（複数選択可）。', '', '', '', '', '', '', '', '', '', ''],
            // Row 27: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 28: Checkboxes row 1
            ['', '', '□', 'Ⅰ.雇用契約期間', '', '□', 'Ⅳ.労働時間等', '', '□', 'Ⅶ.賃金', '', '', ''],
            // Row 29: Checkboxes row 2
            ['', '', '□', 'Ⅱ.就業の場所', '', '□', 'Ⅴ.休日', '', '□', 'Ⅷ.退職に関する事項', '', '', ''],
            // Row 30: Checkboxes row 3
            ['', '', '□', 'Ⅲ.従事すべき業務の内容', '', '□', 'Ⅵ.休暇', '', '□', 'Ⅸ.その他（社会保険・労働保険の加入状況、健康診断、帰国担保措置）', '', '', ''],
            // Row 31: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 32: Attachment instruction
            ['', '', '②変更後の契約内容が記載された雇用条件書（参考様式第1-6号、別紙を含む。）を添付してください。', '', '', '', '', '', '', '', '', '', ''],
            // Row 33: Note 1
            ['', '', '（雇用条件書は、変更があった部分だけを記載又は既にある雇用条件書に朱書き修正した形で提出してください。）', '', '', '', '', '', '', '', '', '', ''],
            // Row 34: Note 2
            ['', '', '（変更後の契約内容を記した雇用条件書は、対象となる特定技能外国人本人が十分に理解できる言語で翻訳し、説明し、', '', '', '', '', '', '', '', '', '', ''],
            // Row 35: Note 3
            ['', '', '当該外国人が十分に理解したことを確認した上で、署名を得る必要があります。）', '', '', '', '', '', '', '', '', '', ''],
            // Row 36: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 37: Section 3
            ['③', '届出機関', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 38: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 39: Corporate number
            ['', '法人番号（13桁）', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 40: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 41: Organization name
            ['', '機関の氏名又は名称', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 42: Org name value
            ['', '株式会社スグクル', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 43: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 44: Address header
            ['', '機関の住所', '〒', '', '-', '', '', '', '', '', '', '', ''],
            // Row 45: Sub label
            ['', '（本店又は主たる事務所）', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 46: Address value
            ['', '鹿児島県鹿児島市〇〇町1-2-3', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 47: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 48: Contact person
            ['', '担当者', '', '', '', '', '電話番号', '', '', '', '', '', '※'],
            // Row 49: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 50: Declaration
            ['以上の記載内容は事実と相違ありません。', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 51: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 52: Signature
            ['本届出書作成者の署名／作成年月日', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 53: Date
            ['', '', '', '', '', '', '', '', '', todayYear, '年', todayMonth, '月', todayDay, '日'],
            // Row 54: Empty
            ['', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 55: Note
            ['注意', '届出書作成後届出までに記載内容に変更が生じた場合、特定技能所属機関職員（又は委任を受けた作成者）が変更箇所を訂正し署名すること。', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 56: Note reference
            ['（注）本書中、※のついた連絡先については、届出内容の確認のため、連絡させていただく場合があります。', '', '', '', '', '', '', '', '', '', '', '', ''],
            // Row 57: Reference
            ['（記載要領）', '', '', '', '', '', '', '', '', '', '', '', ''],
        ];

        const ws1 = XLSX.utils.aoa_to_sheet(formData);

        // Set column widths to match form layout
        ws1['!cols'] = [
            { wch: 4 },   // A - Section numbers
            { wch: 18 },  // B - Labels
            { wch: 3 },   // C - Checkbox/Postal
            { wch: 18 },  // D - Values
            { wch: 3 },   // E - Separator
            { wch: 3 },   // F - Checkbox
            { wch: 15 },  // G - Values
            { wch: 3 },   // H - 年
            { wch: 4 },   // I - Month value
            { wch: 3 },   // J - 月
            { wch: 12 },  // K - Day/Values
            { wch: 3 },   // L - 日
            { wch: 5 },   // M - Notes
        ];

        // Add merges for title and other elements
        ws1['!merges'] = [
            // Title merge
            { s: { r: 2, c: 3 }, e: { r: 2, c: 9 } },
            // Legal text merge
            { s: { r: 6, c: 0 }, e: { r: 6, c: 12 } },
            // Name field merge
            { s: { r: 10, c: 1 }, e: { r: 10, c: 8 } },
            // Declaration merge
            { s: { r: 49, c: 0 }, e: { r: 49, c: 8 } },
            // Signature line merge
            { s: { r: 51, c: 0 }, e: { r: 51, c: 8 } },
            // Note merge
            { s: { r: 54, c: 1 }, e: { r: 54, c: 12 } },
            // Note 2 merge
            { s: { r: 55, c: 0 }, e: { r: 55, c: 12 } },
        ];

        XLSX.utils.book_append_sheet(wb, ws1, '特定技能雇用契約に係る届出書');

        // ===== Sheet 2: 添付書類チェックリスト =====
        const checklistData = [
            ['添付書類チェックリスト'],
            [''],
            ['確認', '書類名', '備考'],
            ['□', '特定技能雇用契約書の写し', '変更後の契約内容を記載'],
            ['□', '雇用条件書（参考様式第1-6号）', '変更があった部分を記載'],
            ['□', '雇用条件書の別紙', '必要に応じて'],
            ['□', '在留カードの写し（両面）', ''],
            ['□', 'パスポートの写し', '顔写真ページ'],
            ['□', '届出書（本様式）', '本ファイル'],
            [''],
            ['届出の留意事項'],
            ['・届出は、届出事由が生じた日から14日以内に行ってください。'],
            ['・届出書は、オンライン又は郵送により提出してください。'],
            ['・届出書の記載内容に変更があった場合は、速やかに届け出てください。'],
            ['・外国人本人が十分に理解できる言語で説明し、署名を得てください。'],
        ];

        const ws2 = XLSX.utils.aoa_to_sheet(checklistData);
        ws2['!cols'] = [
            { wch: 8 },
            { wch: 40 },
            { wch: 30 }
        ];

        XLSX.utils.book_append_sheet(wb, ws2, 'チェックリスト');

        // ===== Sheet 3: 届出履歴 =====
        const historyData = [
            ['届出管理履歴'],
            [''],
            ['日時', 'ステータス', '担当者', '備考'],
            [new Date().toLocaleString('ja-JP'), '書類作成', 'システム', '自動生成'],
            ['', '提出予定', '', notice.deadline + 'まで'],
        ];

        const ws3 = XLSX.utils.aoa_to_sheet(historyData);
        ws3['!cols'] = [
            { wch: 20 },
            { wch: 15 },
            { wch: 15 },
            { wch: 30 }
        ];

        XLSX.utils.book_append_sheet(wb, ws3, '履歴');

        // Generate filename with form number
        const fileName = `様式3-1-1_特定技能雇用契約変更届出_${notice.personName}_${notice.eventDate}.xlsx`;

        // Download
        XLSX.writeFile(wb, fileName);

        setSuccessMessage(`公式様式のExcelファイル「${fileName}」をダウンロードしました`);
        setTimeout(() => setSuccessMessage(null), 3000);
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
                                        <option key={type.value} value={type.value}>
                                            {type.label} ({type.code})
                                        </option>
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
                                            {person.names.full_name} ({person.demographics?.nationality || person.nationality || '国籍不明'})
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
                                        {notice.personNationality && (
                                            <span className="ml-2">({notice.personNationality})</span>
                                        )}
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
                                                onClick={() => handleDownloadExcel(notice)}
                                                className="btn btn-primary text-sm flex items-center gap-1"
                                            >
                                                <FileSpreadsheet className="w-4 h-4" />
                                                Excel ダウンロード
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
                    <p className="text-sm text-gray-600 mb-3">
                        特定技能外国人の受入れに関する届出は、事由発生日から14日以内に行う必要があります。
                        このシステムでは届出書類の自動生成と期限管理を行い、提出漏れを防止します。
                    </p>
                    <div className="text-xs text-gray-500">
                        <strong>ダウンロード形式:</strong> Excelファイル（.xlsx）- 届出書、チェックリスト、履歴の3シート構成
                    </div>
                </div>
            </div>
        </div>
    );
}
