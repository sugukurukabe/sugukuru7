import React from 'react';
import { DailySummary } from '../../types/operations';
import { Users, Banknote, Clock } from 'lucide-react';

interface Props {
    summary: DailySummary;
}

export const DailySummaryCards: React.FC<Props> = ({ summary }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl hover:translate-y-[-4px] transition-transform">
                <div className="flex items-center gap-4 mb-2 opacity-80">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium">👥 稼働人数</span>
                </div>
                <div className="text-3xl font-bold">{summary.totalWorkers.toLocaleString()} <span className="text-lg font-normal opacity-70">名</span></div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl hover:translate-y-[-4px] transition-transform">
                <div className="flex items-center gap-4 mb-2 opacity-80">
                    <Banknote className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-medium">💰 予想売上</span>
                </div>
                <div className="text-3xl font-bold">¥{summary.totalRevenue.toLocaleString()}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl hover:translate-y-[-4px] transition-transform">
                <div className="flex items-center gap-4 mb-2 opacity-80">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-medium">⏱️ 総稼働時間</span>
                </div>
                <div className="text-3xl font-bold">{summary.totalHours.toLocaleString()} <span className="text-lg font-normal opacity-70">時間</span></div>
            </div>
        </div>
    );
};
