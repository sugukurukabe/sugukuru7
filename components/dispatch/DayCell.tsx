import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { clsx } from 'clsx';
import { DaySlot } from '../../types/dispatch';
import { WorkerChip } from './WorkerChip';
import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface Props {
    date: string;
    clientOrgId: string;
    slot: DaySlot;
}

export const DayCell: React.FC<Props> = ({ date, clientOrgId, slot }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `${clientOrgId}:${date}`,
        data: { clientOrgId, date }
    });

    const statusIcons = {
        fulfilled: <CheckCircle2 className="w-3 h-3 text-green-500" />,
        partial: <HelpCircle className="w-3 h-3 text-yellow-500" />,
        shortage: <AlertCircle className="w-3 h-3 text-red-500" />
    };

    return (
        <div
            ref={setNodeRef}
            className={clsx(
                "min-h-[80px] p-2 border-r border-b border-white/10 transition-colors flex flex-col gap-1.5",
                isOver ? "bg-blue-500/10" : "hover:bg-white/5"
            )}
        >
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/40">{slot.count}/{slot.required}</span>
                {statusIcons[slot.status]}
            </div>

            <div className="flex flex-wrap gap-1">
                {slot.workers.map((w) => (
                    <WorkerChip key={w.slotId} personId={w.personId} name={w.name} slotId={w.slotId} />
                ))}
            </div>
        </div>
    );
};
