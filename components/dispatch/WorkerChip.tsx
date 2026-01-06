import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { User } from 'lucide-react';

interface Props {
    personId: string;
    name: string;
    slotId?: string;
    isSimulation?: boolean;
}

export const WorkerChip: React.FC<Props> = ({ personId, name, slotId, isSimulation }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: slotId || personId,
        data: { personId, name, slotId }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={clsx(
                "flex items-center gap-2 px-2 py-1 rounded-md text-[10px] whitespace-nowrap cursor-grab active:cursor-grabbing transition-all",
                isDragging ? "opacity-30 scale-95" : "opacity-100",
                isSimulation ? "bg-orange-500/20 border border-orange-500/50" : "bg-blue-500/20 border border-blue-500/30"
            )}
        >
            <User className="w-3 h-3 text-blue-400" />
            <span className="font-semibold text-white/90">{name}</span>
        </div>
    );
};
