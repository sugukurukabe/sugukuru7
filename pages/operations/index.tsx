import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { DailyOperationsResponse, BusinessDivision, RegionSummary } from '../../types/operations';
import { DailySummaryCards } from '../../components/operations/DailySummaryCards';
import { DivisionTabs } from '../../components/operations/DivisionTabs';
import { DivisionSummaryTable } from '../../components/operations/DivisionSummaryTable';
import { RegionList } from '../../components/operations/RegionList';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function OperationsDashboard() {
    const [data, setData] = useState<DailyOperationsResponse | null>(null);
    const [selectedDivision, setSelectedDivision] = useState<BusinessDivision | 'all'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 実際には API から取得する
        // mockFetch();
        setLoading(false);
    }, []);

    // フィルタリングされた地域データを取得
    const getFilteredRegions = (): RegionSummary[] => {
        if (!data) return [];
        if (selectedDivision === 'all') {
            // 全ての事業の地域データを合算（地域名でマージ）
            const regMap: Record<string, RegionSummary> = {};
            data.divisions.forEach(div => {
                div.regions.forEach(reg => {
                    if (!regMap[reg.region]) {
                        regMap[reg.region] = { region: reg.region, totalRevenue: 0, clients: [] };
                    }
                    regMap[reg.region].totalRevenue += reg.totalRevenue;
                    regMap[reg.region].clients.push(...reg.clients);
                });
            });
            return Object.values(regMap);
        } else {
            const div = data.divisions.find(d => d.division === selectedDivision);
            return div ? div.regions : [];
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans selection:bg-blue-500/30">
            <Head>
                <title>日次稼働ダッシュボード | SUGUKURU</title>
            </Head>

            <main className="max-w-6xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
                            日次稼働ダッシュボード
                        </h1>
                        <p className="text-white/50 text-sm font-medium">
                            {format(new Date(), 'yyyy年MM月dd日 (EEEE)', { locale: ja })}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest text-blue-400">
                            Live Status
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    </div>
                ) : (
                    <>
                        {/* 1. 本日サマリー */}
                        {data && <DailySummaryCards summary={data.summary} />}

                        {/* 2. 事業別タブ */}
                        <DivisionTabs selectedDivision={selectedDivision} onSelect={setSelectedDivision} />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* 3. 事業別サマリーテーブル */}
                            <div className="lg:col-span-2">
                                {data && <DivisionSummaryTable divisions={data.divisions} />}
                            </div>

                            {/* 4. 地域別詳細 */}
                            <div className="lg:col-span-1">
                                <RegionList regions={getFilteredRegions()} />
                            </div>
                        </div>
                    </>
                )}
            </main>

            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-image: 
            radial-gradient(at 0% 0%, hsla(210,100%,10%,0.5) 0, transparent 50%), 
            radial-gradient(at 100% 0%, hsla(280,100%,10%,0.5) 0, transparent 50%);
        }
      `}</style>
        </div>
    );
}
