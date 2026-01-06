import React from 'react';
import { DispatchGridResponse } from '../../types/dispatch';
import { DayCell } from './DayCell';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Props {
    data: DispatchGridResponse;
}

export const DispatchGrid: React.FC<Props> = ({ data }) => {
    const dates = Object.keys(data.clients[0].slots).sort();

    return (
        <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 backdrop-blur-md">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-white/10 text-[11px] font-bold uppercase tracking-wider text-white/60">
                            <th className="px-4 py-3 text-left w-48 border-r border-white/10">配置先 ＼ 日付</th>
                            {dates.map((d) => (
                                <th key={d} className="px-4 py-3 text-center border-r border-white/10">
                                    {format(parseISO(d), 'M/d (E)', { locale: ja })}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.clients.map((client) => (
                            <tr key={client.clientOrgId} className="border-b border-white/10">
                                <td className="px-4 py-3 border-r border-white/10">
                                    <div className="font-semibold text-sm">🚜 {client.clientName}</div>
                                    <div className="text-[10px] text-white/40">{client.region}</div>
                                    <div className="text-[10px] mt-1 bg-white/10 inline-block px-1.5 rounded">
                                        必要: {client.requiredWorkers}名
                                    </div>
                                </td>
                                {dates.map((d) => (
                                    <td key={d} className="p-0 border-r border-white/10 align-top">
                                        <DayCell
                                            date={d}
                                            clientOrgId={client.clientOrgId}
                                            slot={client.slots[d]}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
