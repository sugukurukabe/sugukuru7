import React from 'react';
import { DealActivity } from '../../types/deals';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Phone, Users, Mail, FileText, Repeat, Info } from 'lucide-react';

interface Props {
    activities: DealActivity[];
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
    call: <Phone className="w-3.5 h-3.5 text-blue-400" />,
    visit: <Users className="w-3.5 h-3.5 text-purple-400" />,
    email: <Mail className="w-3.5 h-3.5 text-green-400" />,
    proposal: <FileText className="w-3.5 h-3.5 text-yellow-400" />,
    status_change: <Repeat className="w-3.5 h-3.5 text-orange-400" />,
    default: <Info className="w-3.5 h-3.5 text-white/50" />
};

export const ActivityTimeline: React.FC<Props> = ({ activities }) => {
    return (
        <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:w-px before:bg-white/10">
            {activities.map((act) => (
                <div key={act.activityId} className="relative pl-10">
                    <div className="absolute left-0 top-1 p-1 bg-[#1a1c22] border border-white/10 rounded-full z-10 shadow-lg">
                        {ACTIVITY_ICONS[act.activityType] || ACTIVITY_ICONS.default}
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.08] transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                                {format(parseISO(act.activityDate), 'yyyy/MM/dd HH:mm', { locale: ja })}
                            </span>
                            <span className="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">
                                by {act.performedByName || 'System'}
                            </span>
                        </div>

                        <p className="text-sm text-white/90 leading-relaxed mb-3">
                            {act.description}
                        </p>

                        {act.outcome && (
                            <div className="text-[11px] bg-black/20 rounded px-3 py-2 border-l-2 border-blue-500/50">
                                <span className="font-bold text-blue-400 mr-2">結果:</span>
                                <span className="text-white/70">{act.outcome}</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {activities.length === 0 && (
                <div className="text-center py-12 text-white/20 text-sm italic">
                    活動履歴はありません
                </div>
            )}
        </div>
    );
};
