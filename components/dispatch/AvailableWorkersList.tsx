import React from 'react';
import { AvailableWorker } from '../../types/dispatch';
import { WorkerChip } from './WorkerChip';
import { Search } from 'lucide-react';

interface Props {
    workers: AvailableWorker[];
}

export const AvailableWorkersList: React.FC<Props> = ({ workers }) => {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    👥 空き人員（ドラッグして配置）
                </h3>
                <div className="text-[10px] text-white/40">{workers.length}名</div>
            </div>

            <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/30" />
                <input
                    type="text"
                    placeholder="名前で検索..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
            </div>

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {workers.map((w) => (
                    <WorkerChip key={w.personId} personId={w.personId} name={w.name} />
                ))}
                {workers.length === 0 && (
                    <div className="text-center w-full py-8 text-white/20 text-xs italic">
                        空き人員はいません
                    </div>
                )}
            </div>
        </div>
    );
};
