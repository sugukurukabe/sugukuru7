"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Play,
    Save,
    X,
    AlertTriangle,
    Users,
    BarChart3,
    RefreshCw,
    Plus
} from 'lucide-react';
import { clsx } from 'clsx';

// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sugukuru-api-1027796998462.asia-northeast1.run.app';

interface WorkerSlot {
    personId: string;
    name: string;
    status: 'confirmed' | 'tentative' | 'vacant';
}

interface ClientWeek {
    weekNumber: number;
    weekLabel: string;
    slots: WorkerSlot[];
    required: number;
}

interface ClientRow {
    clientId: string;
    clientName: string;
    region: string;
    weeks: ClientWeek[];
}

export default function DispatchBoardPage() {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}年${now.getMonth() + 1}月`;
    });
    const [data, setData] = useState<ClientRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);

    const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Try to fetch from API
            const response = await fetch(`${API_BASE}/api/v1/dispatch/grid`);
            if (response.ok) {
                const apiData = await response.json();
                if (apiData.clients && apiData.clients.length > 0) {
                    setData(apiData.clients);
                } else {
                    // No data from API
                    setData([]);
                }
            } else {
                // API returned error - show empty state
                setData([]);
            }
        } catch (error) {
            console.error('Failed to fetch dispatch data:', error);
            // No mock data - show empty state
            setData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
            case 'tentative': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const calculateFillRate = () => {
        let filled = 0;
        let total = 0;
        data.forEach(client => {
            client.weeks?.forEach(week => {
                total += week.required || 0;
                filled += week.slots?.length || 0;
            });
        });
        return total > 0 ? ((filled / total) * 100).toFixed(1) : '0';
    };

    const calculateTotalWorkers = () => {
        const workers = new Set<string>();
        data.forEach(client => {
            client.weeks?.forEach(week => {
                week.slots?.forEach(slot => {
                    if (slot.personId) workers.add(slot.personId);
                });
            });
        });
        return workers.size;
    };

    const calculateVacantSlots = () => {
        let vacant = 0;
        data.forEach(client => {
            client.weeks?.forEach(week => {
                const diff = (week.required || 0) - (week.slots?.length || 0);
                if (diff > 0) vacant += diff;
            });
        });
        return vacant;
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Simulation Banner */}
            {isSimulating && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <div>
                            <span className="font-semibold text-amber-800">シミュレーション中</span>
                            <span className="text-amber-700 ml-2">変更は保存されていません</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsSimulating(false)}
                            className="btn btn-secondary text-sm"
                        >
                            <X className="w-4 h-4 mr-1" /> 破棄
                        </button>
                        <button className="btn btn-primary text-sm">
                            <Save className="w-4 h-4 mr-1" /> 本番適用
                        </button>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">配置管理</h1>
                    <p className="text-gray-500 mt-1">月次の人員配置とシミュレーション</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Month Navigator */}
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg">
                        <button className="p-2 hover:bg-gray-50 border-r border-gray-200">
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="px-4 py-2 font-medium text-gray-900">
                            {currentMonth}
                        </div>
                        <button className="p-2 hover:bg-gray-50 border-l border-gray-200">
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    <button
                        onClick={fetchData}
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
                    </button>

                    {!isSimulating && (
                        <button
                            onClick={() => setIsSimulating(true)}
                            className="btn btn-primary"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            シミュレーション開始
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{calculateFillRate()}%</div>
                        <div className="text-sm text-gray-500">充足率</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                        <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{calculateTotalWorkers()}</div>
                        <div className="text-sm text-gray-500">稼働人数</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{calculateVacantSlots()}</div>
                        <div className="text-sm text-gray-500">未配置スロット</div>
                    </div>
                </div>
            </div>

            {/* Dispatch Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">データを読み込み中...</p>
                    </div>
                </div>
            ) : data.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">配置データがありません</h3>
                    <p className="text-gray-500 mb-4">派遣先と人材の配置を登録してください</p>
                    <button className="btn btn-primary flex items-center gap-2 mx-auto">
                        <Plus className="w-4 h-4" />
                        新規配置を登録
                    </button>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">
                                        派遣先
                                    </th>
                                    {weekLabels.map((week, idx) => (
                                        <th key={idx} className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            {week}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((client) => (
                                    <tr key={client.clientId} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{client.clientName}</div>
                                            <div className="text-xs text-gray-500">{client.region}</div>
                                        </td>
                                        {(client.weeks || []).slice(0, 5).map((week, idx) => (
                                            <td key={idx} className="px-2 py-3 text-center">
                                                <div className="min-h-[60px] flex flex-col gap-1 items-center justify-center">
                                                    {week.slots && week.slots.length > 0 ? (
                                                        week.slots.map((slot, si) => (
                                                            <span
                                                                key={si}
                                                                className={clsx(
                                                                    "px-2 py-1 text-xs font-medium rounded border cursor-pointer hover:shadow-sm transition-shadow",
                                                                    getStatusColor(slot.status)
                                                                )}
                                                            >
                                                                {slot.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-300 text-xs">空き</span>
                                                    )}
                                                    {week.slots && week.required && week.slots.length < week.required && (
                                                        <span className="text-xs text-amber-600">
                                                            +{week.required - week.slots.length}必要
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        ))}
                                        {/* Fill remaining weeks if less than 5 */}
                                        {Array.from({ length: Math.max(0, 5 - (client.weeks?.length || 0)) }).map((_, idx) => (
                                            <td key={`empty-${idx}`} className="px-2 py-3 text-center">
                                                <div className="min-h-[60px] flex items-center justify-center">
                                                    <span className="text-gray-300 text-xs">-</span>
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Info Card */}
            <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="p-5">
                    <h3 className="font-semibold text-gray-900 mb-2">📅 週次ビュー説明</h3>
                    <p className="text-sm text-gray-600">
                        Week 1〜Week 5は月の各週を表します。派遣先ごとの人員配置状況を確認し、シミュレーションモードで人員調整を行うことができます。
                    </p>
                </div>
            </div>
        </div>
    );
}
