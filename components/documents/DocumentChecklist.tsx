import React from 'react';
import { DocumentChecklist, ChecklistItem } from '../../types/documents';
import { CheckCircle2, AlertCircle, XCircle, Clock, FileText, Download, Eye } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
    data: DocumentChecklist;
    onView?: (docId: string) => void;
    onDownload?: (docId: string) => void;
}

export const DocumentChecklistUI: React.FC<Props> = ({ data, onView, onDownload }) => {
    return (
        <div className="bg-[#1a1c22] border border-white/10 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/2 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white/90">必要書類チェックリスト</h3>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">
                        {data.visaTypeName} 基準
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black italic tracking-tighter text-blue-400">
                        {data.completionRate.toFixed(0)}%
                    </div>
                    <div className="text-[8px] font-black text-white/20 uppercase">COMPLETION</div>
                </div>
            </div>

            <div className="divide-y divide-white/5">
                {data.checklist.map((item) => (
                    <ChecklistItemRow key={item.docType} item={item} onView={onView} onDownload={onDownload} />
                ))}
            </div>
        </div>
    );
};

const ChecklistItemRow: React.FC<{
    item: ChecklistItem;
    onView?: (id: string) => void;
    onDownload?: (id: string) => void;
}> = ({ item, onView, onDownload }) => {
    const isMissing = item.status === 'missing';
    const isExpiring = item.status === 'expiring';

    return (
        <div className="p-4 hover:bg-white/[0.02] transition-colors group">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        item.status === 'valid' ? "bg-emerald-500/10 text-emerald-400" :
                            item.status === 'expiring' ? "bg-amber-500/10 text-amber-400" :
                                item.status === 'expired' ? "bg-rose-500/10 text-rose-400" : "bg-white/5 text-white/20"
                    )}>
                        {item.status === 'valid' ? <CheckCircle2 className="w-4 h-4" /> :
                            item.status === 'missing' ? <XCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white/90">{item.docTypeName}</span>
                            {item.required && (
                                <span className="text-[8px] font-black bg-white/5 text-white/30 px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">
                                    Required
                                </span>
                            )}
                        </div>
                        {item.document ? (
                            <p className="text-[10px] font-medium text-white/40 italic truncate max-w-[200px]">
                                {item.document.fileName}
                            </p>
                        ) : (
                            <p className="text-[10px] font-medium text-rose-500/60 uppercase tracking-tighter">
                                Not Submitted
                            </p>
                        )}
                    </div>
                </div>

                {item.validUntil && (
                    <div className="hidden md:flex flex-col items-end gap-1 px-4">
                        <span className="text-[8px] font-black text-white/20 uppercase">Valid Until</span>
                        <span className={clsx(
                            "text-[10px] font-bold",
                            isExpiring ? "text-amber-400" : "text-white/60"
                        )}>
                            {item.validUntil}
                        </span>
                    </div>
                )}

                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.document ? (
                        <>
                            <button
                                onClick={() => onView?.(item.document!.documentId)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 text-white/40 hover:text-white transition-all"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDownload?.(item.document!.documentId)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 text-white/40 hover:text-white transition-all"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <button className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                            Upload
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
