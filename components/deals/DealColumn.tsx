import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Deal, DealStatus } from '../../types/deals';
import { DealCard } from './DealCard';

interface Props {
    status: DealStatus;
    statusName: string;
    color: string;
    deals: Deal[];
}

export const DealColumn: React.FC<Props> = ({ status, statusName, color, deals }) => {
    return (
        <div className="flex-1 min-w-[280px] bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col max-h-screen overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <h3 className="font-bold text-sm text-white/80">{statusName}</h3>
                    <span className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-white/40">
                        {deals.length}
                    </span>
                </div>
            </div>

            <Droppable droppableId={status}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
              flex-1 p-3 overflow-y-auto custom-scrollbar transition-colors
              ${snapshot.isDraggingOver ? 'bg-white/[0.04]' : ''}
            `}
                    >
                        {deals.map((deal, index) => (
                            <DealCard key={deal.dealId} deal={deal} index={index} />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};
