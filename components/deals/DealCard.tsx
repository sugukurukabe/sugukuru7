import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Deal, CONTRACT_ICONS } from '../../types/deals';
import { Calendar, User, Target, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Props {
    deal: Deal;
    index: number;
}

export const DealCard: React.FC<Props> = ({ deal, index }) => {
    return (
        <Draggable draggableId={deal.dealId} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`
            bg-[#1a1c22] border border-white/10 rounded-xl p-4 mb-3 shadow-xl transition-all
            ${snapshot.isDragging ? 'rotate-3 scale-105 border-blue-500/50 shadow-blue-500/20' : 'hover:border-white/20 hover:translate-y-[-2px]'}
          `}
                >
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm text-white/90 line-clamp-1">{deal.clientName}</h4>
                        <span className="text-[10px] text-white/40 font-mono">{deal.dealNumber || 'NEW'}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs">{CONTRACT_ICONS[deal.contractCategory]}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded text-white/70">
                            {deal.requiredHeadcount}名 募集
                        </span>
                    </div>

                    <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-2 text-[10px] text-white/50">
                            <Calendar className="w-3 h-3" />
                            <span>{deal.expectedStartDate ? format(parseISO(deal.expectedStartDate), 'yyyy/MM/dd') : '未定'} 開始予定</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-white/50">
                            <User className="w-3 h-3" />
                            <span>担当: {deal.salesRepName || '未指定'}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="flex-1 mr-3">
                            <div className="flex justify-between text-[9px] mb-1 font-bold">
                                <span className="text-white/40">確度</span>
                                <span className="text-blue-400">{deal.probability}%</span>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                    style={{ width: `${deal.probability}%` }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-white/30">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{format(parseISO(deal.updatedAt), 'M/dd')}</span>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};
