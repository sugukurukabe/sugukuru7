import React from 'react';
import { BusinessDivision, DIVISION_LABELS, DIVISION_ICONS } from '../../types/operations';
import { clsx } from 'clsx';

interface Props {
    selectedDivision: BusinessDivision | 'all';
    onSelect: (division: BusinessDivision | 'all') => void;
}

export const DivisionTabs: React.FC<Props> = ({ selectedDivision, onSelect }) => {
    const tabs: (BusinessDivision | 'all')[] = ['all', 'dispatch', 'subcontracting', 'support', 'it'];

    return (
        <div className="flex gap-2 p-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl mb-6 overflow-x-auto">
            {tabs.map((tab) => (
                <button
                    key={tab}
                    onClick={() => onSelect(tab)}
                    className={clsx(
                        "px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                        selectedDivision === tab
                            ? "bg-white/20 text-white shadow-lg border border-white/20 ring-1 ring-white/20"
                            : "text-white/60 hover:text-white hover:bg-white/10"
                    )}
                >
                    {tab === 'all' ? '🌐 全事業' : `${DIVISION_ICONS[tab as BusinessDivision]} ${DIVISION_LABELS[tab as BusinessDivision]}`}
                </button>
            ))}
        </div>
    );
};
