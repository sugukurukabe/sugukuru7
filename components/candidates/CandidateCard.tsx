import React from 'react';
import { Candidate, AVAILABILITY_CONFIG } from '../../types/candidates';
import { MapPin, Briefcase, Phone, MoreHorizontal, FileText, PlusCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
    candidate: Candidate;
    onPropose: (candidate: Candidate) => void;
    onDetail: (candidate: Candidate) => void;
}

export const CandidateCard: React.FC<Props> = ({ candidate, onPropose, onDetail }) => {
    const config = AVAILABILITY_CONFIG[candidate.availability];

    return (
        <div className="bg-[#1a1c22] border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all active:scale-[0.98] hover:border-white/20">
            <div className="p-4 space-y-4">
                {/* Header: Availability & Basic Info */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 text-white/20 overflow-hidden">
                                {candidate.photoUrl ? (
                                    <img src={candidate.photoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xl font-bold">{candidate.fullName[0]}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 text-[10px]">{config.icon}</div>
                        </div>
                        <div>
                            <h3 className="font-bold text-white/90">{candidate.fullName}</h3>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                                {candidate.nationalityName} • {candidate.age}歳
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span
                            className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter"
                            style={{ backgroundColor: `${config.color}20`, color: config.color }}
                        >
                            {config.label}
                        </span>
                        {candidate.expectedHourlyRate && (
                            <span className="text-sm font-black text-white/80">¥{candidate.expectedHourlyRate.toLocaleString()}<span className="text-[9px] text-white/30 ml-0.5">/h〜</span></span>
                        )}
                    </div>
                </div>

                {/* Visa Info */}
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-white/40 font-bold uppercase">Visa: {candidate.visaTypeName}</span>
                        <span className={clsx("text-[10px] font-bold", (candidate.daysUntilVisaExpiry || 0) < 90 ? "text-orange-400" : "text-white/60")}>
                            残{candidate.daysUntilVisaExpiry}日
                        </span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className={clsx("h-full rounded-full", (candidate.daysUntilVisaExpiry || 0) < 90 ? "bg-orange-500" : "bg-blue-500")}
                            style={{ width: `${Math.min(100, (candidate.daysUntilVisaExpiry || 0) / 365 * 100)}%` }}
                        />
                    </div>
                </div>

                {/* Skills & Regions */}
                <div className="flex flex-wrap gap-1.5">
                    {candidate.skillLabels.map(s => (
                        <span key={s} className="text-[9px] px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg font-bold">
                            {s}
                        </span>
                    ))}
                    {candidate.preferredRegionLabels.map(r => (
                        <span key={r} className="text-[9px] px-2 py-1 bg-white/5 text-white/40 border border-white/10 rounded-lg font-bold">
                            {r}
                        </span>
                    ))}
                </div>

                {/* Last History */}
                {candidate.employmentHistory?.lastClient && (
                    <div className="flex items-center gap-2 text-[10px] text-white/30 italic">
                        <Briefcase className="w-3 h-3" />
                        <span>前職: {candidate.employmentHistory.lastClient} ({candidate.employmentHistory.lastEndDate}終了)</span>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                    <a
                        href={`tel:${candidate.phone}`}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <Phone className="w-4 h-4 text-blue-400" />
                        <span className="text-[8px] font-black uppercase text-white/40">電話</span>
                    </a>
                    <button
                        onClick={() => onDetail(candidate)}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <FileText className="w-4 h-4 text-white/60" />
                        <span className="text-[8px] font-black uppercase text-white/40">詳細</span>
                    </button>
                    <button
                        onClick={() => onPropose(candidate)}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 transition-colors group"
                    >
                        <PlusCircle className="w-4 h-4 text-blue-400 group-active:scale-125 transition-transform" />
                        <span className="text-[8px] font-black uppercase text-blue-400/60">提案</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
