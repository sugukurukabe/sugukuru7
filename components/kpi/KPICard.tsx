import React from 'react';
import { KPIMetric } from '../../types/kpi';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
    title: string;
    metric: KPIMetric;
    prefix?: string;
    suffix?: string;
}

export const KPICard: React.FC<Props> = ({ title, metric, prefix = '', suffix = '' }) => {
    const getTrendIcon = () => {
        if (metric.trend === 'up') return <TrendingUp className="w-3 h-3 text-emerald-400" />;
        if (metric.trend === 'down') return <TrendingDown className="w-3 h-3 text-rose-400" />;
        return <Minus className="w-3 h-3 text-white/20" />;
    };

    return (
        <div className="bg-[#1a1c22] border border-white/10 rounded-3xl p-6 space-y-4 transition-all hover:bg-[#1f2129]">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{title}</h4>
                {metric.changePercent !== undefined && (
                    <div className={clsx(
                        "flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full",
                        metric.trend === 'up' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    )}>
                        {getTrendIcon()}
                        {metric.changePercent}%
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white/90">
                        {prefix}{metric.value.toLocaleString()}{suffix}
                    </span>
                    {metric.target && (
                        <span className="text-[10px] font-bold text-white/20 ml-auto">
                            目標: {prefix}{metric.target.toLocaleString()}{suffix}
                        </span>
                    )}
                </div>

                {metric.achievement !== undefined && (
                    <div className="space-y-1.5 pt-1">
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={clsx(
                                    "h-full rounded-full transition-all duration-1000",
                                    metric.achievement >= 100 ? "bg-emerald-500" :
                                        metric.achievement >= 80 ? "bg-amber-500" : "bg-rose-500"
                                )}
                                style={{ width: `${Math.min(100, metric.achievement)}%` }}
                            />
                        </div>
                        <div className="text-right text-[9px] font-black tracking-widest text-white/40">
                            {metric.achievement.toFixed(1)}% ACHIEVED
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
