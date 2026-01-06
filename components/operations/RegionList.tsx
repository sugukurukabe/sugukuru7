import React, { useState } from 'react';
import { RegionSummary } from '../../types/operations';
import { ChevronDown, MapPin } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
    regions: RegionSummary[];
}

export const RegionList: React.FC<Props> = ({ regions }) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const toggle = (reg: string) => {
        setExpanded(prev => ({ ...prev, [reg]: !prev[reg] }));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 text-white/70">
                <MapPin className="w-4 h-4" />
                <h3 className="text-sm font-semibold">📍 地域別詳細</h3>
            </div>

            {regions.map((r) => (
                <div key={r.region} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all">
                    <button
                        onClick={() => toggle(r.region)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="font-semibold">{r.region}</span>
                            <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/60">
                                {r.clients.length} 企業
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-mono text-green-400 font-bold">¥{r.totalRevenue.toLocaleString()}</span>
                            <ChevronDown className={clsx("w-4 h-4 transition-transform", expanded[r.region] && "rotate-180")} />
                        </div>
                    </button>

                    {expanded[r.region] && (
                        <div className="p-4 bg-black/20 border-t border-white/10 space-y-3">
                            {r.clients.map((c) => (
                                <div key={c.org_id} className="flex justify-between items-center pl-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                        <span>{c.name} ({c.workerCount}名)</span>
                                    </div>
                                    <span className="font-mono opacity-80">¥{c.totalRevenue.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {regions.length === 0 && (
                <div className="text-center py-12 text-white/40 border border-dashed border-white/20 rounded-xl">
                    稼働データがありません
                </div>
            )}
        </div>
    );
};
