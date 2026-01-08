
import React, { useState } from 'react';
import { X, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
// Removed circular import of Deal


interface ImportDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (dealData: Partial<AnyDeal>) => void;
}

// Loose type for import
interface AnyDeal {
    [key: string]: any;
}

export default function ImportDealModal({ isOpen, onClose, onImport }: ImportDealModalProps) {
    const [inputText, setInputText] = useState('');
    const [previewData, setPreviewData] = useState<AnyDeal | null>(null);

    if (!isOpen) return null;

    const parseText = (text: string) => {
        const lines = text.split('\n');
        const data: AnyDeal = {};

        // Helper to extract value
        const getVal = (line: string, key: string) => {
            if (line.includes(key)) {
                return line.split(key)[1].trim();
            }
            return null;
        };

        lines.forEach(line => {
            // Basic Fields
            if (line.startsWith('派遣先事業所名:')) data.client_name = getVal(line, '派遣先事業所名:');
            // if (line.startsWith('事業所名(カナ):')) data.client_name_kana = getVal(line, '事業所名(カナ):');
            if (line.startsWith('所在地:')) data.client_address = getVal(line, '所在地:');
            if (line.startsWith('電話番号:')) data.client_phone = getVal(line, '電話番号:');

            if (line.startsWith('契約種別:')) {
                const val = getVal(line, '契約種別:');
                if (val?.includes('派遣')) data.contract_category = 'dispatch';
                else if (val?.includes('紹介')) data.contract_category = 'introduction';
                else data.contract_category = 'other';
            }

            if (line.startsWith('業務内容:')) data.job_description = getVal(line, '業務内容:');

            if (line.startsWith('期間:')) {
                const val = getVal(line, '期間:');
                if (val) {
                    const parts = val.split('〜').map(s => s.trim());
                    if (parts[0]) data.expected_start_date = parts[0];
                    if (parts[1]) data.expected_end_date = parts[1];
                }
            }

            if (line.startsWith('必要人数:')) {
                const val = getVal(line, '必要人数:');
                if (val) data.required_headcount = parseInt(val.replace('名', '')) || 1;
            }

            if (line.startsWith('単価(無):')) {
                const val = getVal(line, '単価(無):');
                if (val) data.hourly_rate_no_license = parseInt(val.replace('¥', '').replace(',', '')) || 0;
            }

            if (line.startsWith('単価(有):')) {
                const val = getVal(line, '単価(有):');
                if (val) data.hourly_rate_with_license = parseInt(val.replace('¥', '').replace(',', '')) || 0;
            }

            if (line.startsWith('営業担当者:')) data.sales_rep_name = getVal(line, '営業担当者:');
            if (line.startsWith('備考:')) data.notes = getVal(line, '備考:');

            // Complex mappings could go here (Supervisor, etc)
        });

        // Set Deal Name automatically
        if (data.client_name) {
            data.deal_name = `${data.client_name} - ${data.job_description || '新規案件'}`;
        }

        // Status defaults to won or negotiation?
        // User said "Deal is closed... sends info". So likely 'won' or 'negotiation' (contracting).
        data.status = 'negotiation';
        data.probability = 90;

        return data;
    };

    const handleParse = () => {
        const data = parseText(inputText);
        setPreviewData(data);
    };

    const handleConfirm = () => {
        if (previewData) {
            onImport(previewData);
            onClose();
            setInputText('');
            setPreviewData(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold">営業アプリデータの取り込み</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-auto">
                    {!previewData ? (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                営業アプリ（Slack用コピー）のテキストを下に貼り付けてください。<br />
                                自動的に解析し、商談・契約情報として取り込みます。
                            </p>
                            <textarea
                                className="w-full h-64 p-4 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                placeholder={`【スグクル商談シート v3.3 登録情報】\n--------------------------------------\n派遣先事業所名: テ内株式会社\n...`}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                            />
                            <button
                                onClick={handleParse}
                                disabled={!inputText.trim()}
                                className="btn btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <ArrowRight className="w-4 h-4" />
                                解析してプレビュー
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <h3 className="font-bold text-green-800 flex items-center gap-2 mb-3">
                                    <CheckCircle2 className="w-5 h-5" />
                                    解析成功
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <label className="text-gray-500 text-xs">顧客名</label>
                                        <div className="font-medium">{previewData.client_name}</div>
                                    </div>
                                    <div>
                                        <label className="text-gray-500 text-xs">案件名（自動生成）</label>
                                        <div className="font-medium">{previewData.deal_name}</div>
                                    </div>
                                    <div>
                                        <label className="text-gray-500 text-xs">契約種別</label>
                                        <div className="font-medium">{previewData.contract_category}</div>
                                    </div>
                                    <div>
                                        <label className="text-gray-500 text-xs">期間</label>
                                        <div className="font-medium">{previewData.expected_start_date} 〜 {previewData.expected_end_date || '未定'}</div>
                                    </div>
                                    <div>
                                        <label className="text-gray-500 text-xs">単価</label>
                                        <div className="font-medium">¥{previewData.hourly_rate_no_license?.toLocaleString()} (無)</div>
                                    </div>
                                    <div>
                                        <label className="text-gray-500 text-xs">必要人数</label>
                                        <div className="font-medium">{previewData.required_headcount}名</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPreviewData(null)}
                                    className="btn btn-secondary flex-1"
                                >
                                    戻る
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="btn btn-primary flex-1"
                                >
                                    この内容で登録
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
