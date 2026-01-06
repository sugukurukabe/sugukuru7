"use client";
import React, { useState } from 'react';
import Head from 'next/head';
import { useParams } from 'next/navigation';
import { DocumentChecklistUI } from '../../../../components/documents/DocumentChecklist';
import { DocumentUploader } from '../../../../components/documents/DocumentUploader';
import { DocumentChecklist } from '../../../../types/documents';
import { ChevronLeft, Share2, Printer, Plus } from 'lucide-react';
import Link from 'next/link';

export default function PersonDocumentsPage() {
    const params = useParams();
    const personId = (params?.personId as string) || 'unknown';
    const [showUploader, setShowUploader] = useState(false);

    const mockChecklist: DocumentChecklist = {
        personId,
        personName: 'NGUYEN VAN A',
        visaType: 'ssw1',
        visaTypeName: '特定技能1号',
        completionRate: 77.8,
        checklist: [
            { docType: 'resident_card', docTypeName: '在留カード', required: true, status: 'valid', validUntil: '2026-03-15', document: { documentId: '1', fileName: 'rc_nguyen.jpg' } as any },
            { docType: 'passport', docTypeName: 'パスポート', required: true, status: 'valid', validUntil: '2028-05-20', document: { documentId: '2', fileName: 'passport_nguyen.pdf' } as any },
            { docType: 'health_checkup', docTypeName: '健康診断書', required: true, status: 'expiring', validUntil: '2025-02-15', daysUntilExpiry: 19, document: { documentId: '3', fileName: 'health_2024.pdf' } as any },
            { docType: 'bank_account', docTypeName: '銀行口座情報', required: true, status: 'valid', document: { documentId: '4', fileName: 'bank_copy.jpg' } as any },
            { docType: 'employment_contract', docTypeName: '雇用契約書', required: true, status: 'valid', document: { documentId: '5', fileName: 'contract.pdf' } as any },
            { docType: 'support_plan', docTypeName: '支援計画書', required: true, status: 'valid', document: { documentId: '6', fileName: 'support.pdf' } as any },
            { docType: 'my_number', docTypeName: 'マイナンバーカード', required: false, status: 'missing' },
            { docType: 'tax_certificate', docTypeName: '納税証明書', required: false, status: 'missing' },
            { docType: 'photo', docTypeName: '顔写真', required: true, status: 'valid', document: { documentId: '7', fileName: 'photo.jpg' } as any },
        ],
        summary: {
            required: { total: 7, submitted: 6, missing: 1 },
            optional: { total: 2, submitted: 0, missing: 2 },
            expiring: 1,
            expired: 0
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-10 space-y-8">
            <Head>
                <title>{mockChecklist.personName} の書類 | SUGUKURU</title>
            </Head>

            <nav className="flex items-center justify-between">
                <Link
                    href="/documents"
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> Back to Vault
                </Link>
                <div className="flex gap-2">
                    <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-white transition-colors">
                        <Share2 className="w-4 h-4" />
                    </button>
                    <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-white transition-colors">
                        <Printer className="w-4 h-4" />
                    </button>
                </div>
            </nav>

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black italic tracking-tighter">{mockChecklist.personName}</h1>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
                        Document Repository • {mockChecklist.visaTypeName}
                    </p>
                </div>
                <button
                    onClick={() => setShowUploader(true)}
                    className="px-6 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> 書類を追加する
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    <DocumentChecklistUI data={mockChecklist} />

                    <section className="space-y-4">
                        <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">その他の添付ファイル</h2>
                        <div className="bg-[#1a1c22] border border-white/10 rounded-3xl p-12 text-center">
                            <p className="text-xs font-bold text-white/20 uppercase tracking-widest">その他の書類はありません</p>
                        </div>
                    </section>
                </div>

                <aside className="space-y-8">
                    <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-[32px] p-8 space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em]">Summary Statistics</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-2xl p-4">
                                <div className="text-[8px] font-black text-white/30 uppercase mb-1">Total Docs</div>
                                <div className="text-xl font-black">7</div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4">
                                <div className="text-[8px] font-black text-white/30 uppercase mb-1">Requirement</div>
                                <div className="text-xl font-black text-rose-500">-2</div>
                            </div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl flex items-center justify-between">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Expiring Soon</span>
                            <span className="text-xl font-black text-amber-500">1</span>
                        </div>
                    </div>

                    <div className="bg-[#1a1c22] border border-white/10 rounded-[32px] p-8 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em]">Actions</h3>
                        <button className="w-full py-4 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                            すべての書類を一括ダウンロード
                        </button>
                        <button className="w-full py-4 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                            監査用レポートを出力
                        </button>
                    </div>
                </aside>
            </div>

            {showUploader && (
                <DocumentUploader
                    personName={mockChecklist.personName}
                    onClose={() => setShowUploader(false)}
                    onUpload={(f, t) => {
                        console.log("Uploading", f, t);
                        setShowUploader(false);
                    }}
                />
            )}
        </div>
    );
}
