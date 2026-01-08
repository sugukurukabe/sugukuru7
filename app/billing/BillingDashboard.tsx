
"use client";

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import {
    CreditCard,
    TrendingUp,
    Calendar,
    Download,
    Search
} from 'lucide-react';

interface Billing {
    billing_id: string;
    client_name: string;
    total_amount: number;
    billing_date: string;
    target_month: string;
    status: string;
}

interface BillingDashboardProps {
    data: Billing[];
}

export default function BillingDashboard({ data }: BillingDashboardProps) {
    const totalRevenue = data.reduce((sum, item) => sum + item.total_amount, 0);
    const invoiceCount = data.length;

    // Sort for chart (Top 10)
    const chartData = [...data]
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, 10)
        .map(item => ({
            name: item.client_name.length > 8 ? item.client_name.substring(0, 8) + '...' : item.client_name,
            fullName: item.client_name,
            amount: item.total_amount
        }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">請求管理</h1>
                    <p className="text-gray-500">
                        {data.length > 0 ? `${data[0].target_month}分` : '2025-11分'} の請求データ分析
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn btn-secondary">
                        <Calendar className="w-4 h-4 mr-2" />
                        2025年11月
                    </button>
                    <button className="btn btn-primary">
                        <Download className="w-4 h-4 mr-2" />
                        PDF一括出力
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 flex items-center gap-4 border-l-4 border-blue-500">
                    <div className="p-3 bg-blue-100 rounded-full">
                        <CreditCard className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">請求総額</p>
                        <h3 className="text-2xl font-bold text-gray-900">
                            ¥{totalRevenue.toLocaleString()}
                        </h3>
                    </div>
                </div>
                <div className="card p-6 flex items-center gap-4 border-l-4 border-green-500">
                    <div className="p-3 bg-green-100 rounded-full">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">請求件数</p>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {invoiceCount} <span className="text-sm font-normal text-gray-500">件</span>
                        </h3>
                    </div>
                </div>
                {/* Placeholder for future KPI */}
                <div className="card p-6 flex items-center gap-4 border-l-4 border-purple-500">
                    <div className="p-3 bg-purple-100 rounded-full">
                        <Calendar className="w-8 h-8 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">回収予定日</p>
                        <h3 className="text-2xl font-bold text-gray-900">
                            2025/12/31
                        </h3>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">請求額トップ10企業</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="horizontal" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                                interval={0}
                            />
                            <YAxis
                                tickFormatter={(value) => `¥${value / 10000}万`}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                formatter={(value: number) => [`¥${value.toLocaleString()}`, '請求額']}
                                labelFormatter={(label) => chartData.find(c => c.name === label)?.fullName || label}
                                cursor={{ fill: '#f3f4f6' }}
                            />
                            <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">請求詳細一覧</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="企業名で検索..."
                            className="pl-9 pr-4 py-1.5 text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-3 text-left">請求先企業</th>
                                <th className="px-6 py-3 text-left">請求日</th>
                                <th className="px-6 py-3 text-left">対象月</th>
                                <th className="px-6 py-3 text-right">金額</th>
                                <th className="px-6 py-3 text-center">ステータス</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.map((item) => (
                                <tr key={item.billing_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {item.client_name}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(item.billing_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {item.target_month}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium font-mono text-gray-900">
                                        ¥{item.total_amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            送付済
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
