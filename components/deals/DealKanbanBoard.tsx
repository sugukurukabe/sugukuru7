import React, { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn as KanbanColumnType, DealStatus } from '../../types/deals';
import { DealColumn } from './DealColumn';

interface Props {
    columns: KanbanColumnType[];
    onStatusChange: (dealId: string, newStatus: DealStatus) => void;
}

export const DealKanbanBoard: React.FC<Props> = ({ columns, onStatusChange }) => {
    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) return;

        onStatusChange(draggableId, destination.droppableId as DealStatus);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 h-[calc(100vh-240px)] overflow-x-auto pb-4 custom-scrollbar">
                {columns.map((col) => (
                    <DealColumn
                        key={col.status}
                        status={col.status}
                        statusName={col.statusName}
                        color={col.color}
                        deals={col.deals}
                    />
                ))}
            </div>
        </DragDropContext>
    );
};
