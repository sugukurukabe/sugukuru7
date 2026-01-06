import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
    onUpload: (file: File, docType: string) => void;
    onClose: () => void;
    personName: string;
}

export const DocumentUploader: React.FC<Props> = ({ onUpload, onClose, personName }) => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [docType, setDocType] = useState('resident_card');

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1a1c22] border border-white/10 rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black italic tracking-tighter">UPLOAD DOCUMENT</h3>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{personName} への書類追加</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">書類種別</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['resident_card', 'photo', 'passport', 'health_checkup'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setDocType(t)}
                                    className={clsx(
                                        "py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                        docType === t ? "bg-blue-600 text-white border-blue-500" : "bg-white/5 text-white/40 border-white/5 hover:border-white/10"
                                    )}
                                >
                                    {t.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={clsx(
                            "relative group border-2 border-dashed rounded-[32px] p-12 transition-all flex flex-col items-center justify-center text-center gap-4",
                            dragActive ? "border-blue-500 bg-blue-500/5" : "border-white/5 bg-white/[0.02] hover:border-white/10"
                        )}
                    >
                        {file ? (
                            <>
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-white/90">{file.name}</p>
                                    <p className="text-[10px] font-black text-white/20 uppercase">{(file.size / 1024).toFixed(1)} KB • {file.type}</p>
                                </div>
                                <button onClick={() => setFile(null)} className="text-[10px] font-black text-rose-500/60 uppercase hover:text-rose-500 transition-colors">
                                    ファイルを変更する
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/20 group-hover:scale-110 transition-transform">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-white/60">ファイルをドラッグ＆ドロップ</p>
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">またはファイルを選択</p>
                                </div>
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => e.target.files && setFile(e.target.files[0])}
                                />
                            </>
                        )}
                    </div>

                    <button
                        disabled={!file}
                        onClick={() => file && onUpload(file, docType)}
                        className={clsx(
                            "w-full py-5 rounded-[24px] text-xs font-black uppercase tracking-[0.3em] transition-all",
                            file ? "bg-white text-black hover:scale-[1.02] active:scale-95" : "bg-white/5 text-white/10 cursor-not-allowed"
                        )}
                    >
                        UPLOAD NOW
                    </button>
                </div>
            </div>
        </div>
    );
};
