import React from 'react';
import { DivisionSummary, DIVISION_ICONS, DIVISION_LABELS } from '../../types/operations';

interface Props {
    divisions: DivisionSummary[];
}

export const DivisionSummaryTable: React.FC<Props> = ({ divisions }) => {
    const total = divisions.reduce((acc, d) => acc + d.totalRevenue, 0);

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden mb-8">
            <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    📊 事業別サマリー
                </h3>
            </div>
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-white/10 text-xs font-semibold uppercase tracking-wider text-white/60">
                        <th className="px-6 py-3">事業</th>
                        <th className="px-6 py-3">人数</th>
                        <th className="px-6 py-3 text-right">売上</th>
                        <th className="px-6 py-3 text-right">時間</th>
                        <th className="px-6 py-3 text-right">構成比</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                    {divisions.map((d) => (
                        <tr key={d.division} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 flex items-center gap-3">
                                <span className="text-xl">{DIVISION_ICONS[d.division]}</span>
                                <span className="font-medium">{DIVISION_LABELS[d.division]}</span>
                            </td>
                            <td className="px-6 py-4">{d.workerCount}名</td>
                            <td className="px-6 py-4 text-right font-mono">¥{d.totalRevenue.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">{d.totalHours}h</td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <span className="font-semibold text-blue-400">
                                        {total > 0 ? Math.round((d.totalRevenue / total) * 100) : 0}%
                                    </span>
                                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${total > 0 ? (d.totalRevenue / total) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ))}
                    <tr className="bg-white/10 font-bold">
                        <td className="px-6 py-4">合計</td>
                        <td className="px-6 py-4">{divisions.reduce((acc, d) => acc + d.workerCount, 0)}名</td>
                        <td className="px-6 py-4 text-right font-mono">
                            ¥{total.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                            {divisions.reduce((acc, d) => acc + d.totalHours, 0)}h
                        </td>
                        <td className="px-6 py-4 text-right">100%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
