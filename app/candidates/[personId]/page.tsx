"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Head from 'next/head';
import { Candidate } from '../../../types/candidates';
import { ChevronLeft, MapPin, Briefcase, Calendar, Phone, Mail, Award, Clock, FileText, CheckCircle2 } from 'lucide-react';

export default function CandidateDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!params) return;
            try {
                const response = await fetch(`http://localhost:8000/api/v1/candidates/${params.personId}`);
                if (response.ok) {
                    const data = await response.json();
                    setCandidate(data);
                }
            } catch (error) {
                console.error('Failed to fetch candidate details:', error);
            } finally {
                setLoading(false);
            }
        };
        if (params?.personId) fetchDetail();
    }, [params]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center space-y-4">
                <p className="text-white/40">候補者が見つかりませんでした。</p>
                <button onClick={() => router.back()} className="text-blue-400 font-bold uppercase tracking-widest text-xs">
                    戻る
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white font-sans">
            <Head>
                <title>{candidate.fullName} | 候補者詳細 | スグクル3.0</title>
            </Head>

            {/* Top Navigation */}
            <header className="sticky top-0 z-40 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full text-white/40">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-black tracking-tight">候補者プロファイル</h1>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl text-[10px] font-black uppercase">
                        一括提案に追加
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-10 pb-20">
                {/* Profile Header */}
                <section className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-white/5 rounded-[2.5rem] flex items-center justify-center border-2 border-white/10 overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.15)] transition-all group-hover:border-blue-500/50">
                            {candidate.photoUrl ? (
                                <img src={candidate.photoUrl} alt={candidate.fullName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-5xl font-black text-white/10">{candidate.fullName[0]}</span>
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 border-4 border-[#0a0a0c] rounded-2xl flex items-center justify-center text-xl">
                            ✅
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">
                            <Clock className="w-3 h-3" /> {candidate.availabilityLabel}
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter italic">{candidate.fullName}</h2>
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm font-bold text-white/40 italic">
                            <span className="flex items-center gap-2 pt-1 border-t border-transparent group hover:border-white/10 transition-colors">
                                <MapPin className="w-4 h-4" /> {candidate.nationalityName} • {candidate.age}歳
                            </span>
                            <span className="flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Visa: {candidate.visaTypeName}
                            </span>
                        </div>

                        <div className="flex justify-center md:justify-start gap-4 mt-6">
                            <a href={`tel:${candidate.phone}`} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center gap-3 transition-all active:scale-95">
                                <Phone className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-black uppercase tracking-widest">Call Now</span>
                            </a>
                            <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center gap-3 transition-all active:scale-95">
                                <Mail className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-black uppercase tracking-widest">Message</span>
                            </button>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Left Column */}
                    <div className="space-y-10">
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Skill Set</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {candidate.skillLabels.map(s => (
                                    <div key={s} className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/5 rounded-2xl group hover:border-blue-500/30 transition-all">
                                        <Award className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-bold">{s}</span>
                                    </div>
                                ))}
                                {candidate.skillLabels.length === 0 && (
                                    <p className="text-white/20 text-xs italic">スキル情報なし</p>
                                )}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Work Preferences</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                                    <div className="flex items-center gap-3 text-white/40">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-xs font-black uppercase">希望地域</span>
                                    </div>
                                    <span className="text-sm font-bold">{candidate.preferredRegionLabels.join(' / ') || '全国可能'}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                                    <div className="flex items-center gap-3 text-white/40">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs font-black uppercase">希望時給</span>
                                    </div>
                                    <span className="text-sm font-bold text-blue-400">¥{candidate.expectedHourlyRate?.toLocaleString() || '---'}<span className="text-[10px] ml-1">/h〜</span></span>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-10">
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Immigration Status</h3>
                            <div className="p-6 bg-[#1a1c22] border border-white/10 rounded-[2rem] space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black text-white/20 uppercase mb-1">Visa Expiry Date</p>
                                            <p className="text-lg font-bold">{candidate.visaValidUntil || '---'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-white/20 uppercase mb-1">Days Left</p>
                                            <p className="text-2xl font-black text-blue-400 leading-none">{candidate.daysUntilVisaExpiry}</p>
                                        </div>
                                    </div>
                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000"
                                            style={{ width: `${Math.min(100, (candidate.daysUntilVisaExpiry || 0) / 365 * 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center justify-center gap-2 transition-all">
                                    <Calendar className="w-4 h-4" /> ビザ更新履歴を見る
                                </button>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Recent Placement</h3>
                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                                    <Briefcase className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">鹿児島第一食品工場</p>
                                    <p className="text-[10px] font-black text-white/20 uppercase">2024.08 - 2024.12 • 満了</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0c] to-transparent pointer-events-none">
                    <div className="max-w-xl mx-auto flex gap-4 pointer-events-auto">
                        <button className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-1 active:scale-95">
                            提案リストに追加
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
