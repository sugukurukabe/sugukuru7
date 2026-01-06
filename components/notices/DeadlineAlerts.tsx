import React from 'react';
import { AlertCircle, Clock, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
    alerts: {
        critical: number;
        warning: number;
        info: number;
    };
}

export const DeadlineAlerts: React.FC<Props> = ({ alerts }) => {
    const cards = [
        { title: '3日以内', count: alerts.critical, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: AlertCircle },
        { title: '7日以内', count: alerts.warning, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: Clock },
        { title: '14日以内', count: alerts.info, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Calendar },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cards.map((c) => (
                <div
                    key={c.title}
                    className={clsx(
                        "p-5 rounded-3xl border transition-all hover:scale-[1.02]",
                        c.bg, c.border
                    )}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className={clsx("text-[10px] font-black uppercase tracking-widest", c.color)}>
                            {c.title}
                        </span>
                        <c.icon className={clsx("w-5 h-5", c.color)} />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black">{c.count}</span>
                        <span className="text-xs font-bold text-white/30">件</span>
                    </div>
                </div>
            ))}
        </div>
    );
};
