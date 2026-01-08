
"use client";

import React, { useState, useMemo } from 'react';
import {
    Search,
    Filter,
    Building2,
    MapPin,
    Mail,
    Phone,
    Globe,
    Calendar,
    Briefcase,
    Tag,
    Plus,
    MoreHorizontal
} from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

export interface Client {
    id: string;
    companyName: string;
    department: string;
    position: string;
    lastName: string;
    firstName: string;
    email: string;
    postalCode: string;
    address: string;
    phone: string;
    mobile: string;
    url: string;
    exchangeDate: string;
    source: string; // 'Eight' etc
    prefecture: string;
    serviceType?: 'Dispatch' | 'Recruitment' | 'Lead' | 'Other';
}

interface ClientListProps {
    initialClients: Client[];
}

export default function ClientList({ initialClients }: ClientListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPrefecture, setSelectedPrefecture] = useState<string>('all');
    const [selectedService, setSelectedService] = useState<string>('all');

    // Extract unique prefectures
    const prefectures = useMemo(() => {
        const prefs = new Set(initialClients.map(c => c.prefecture).filter(Boolean));
        return Array.from(prefs).sort();
    }, [initialClients]);

    // Filter logic
    const filteredClients = useMemo(() => {
        return initialClients.filter(client => {
            const matchesSearch =
                client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                client.firstName.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesPrefecture = selectedPrefecture === 'all' || client.prefecture === selectedPrefecture;

            // Mock service matching (defaulting all Eight data to Lead if undefined)
            const serviceType = client.serviceType || 'Lead';
            const matchesService = selectedService === 'all' || serviceType === selectedService;

            return matchesSearch && matchesPrefecture && matchesService;
        });
    }, [initialClients, searchQuery, selectedPrefecture, selectedService]);

    const getServiceColor = (type?: string) => {
        switch (type) {
            case 'Dispatch': return 'bg-purple-100 text-purple-700';
            case 'Recruitment': return 'bg-green-100 text-green-700';
            case 'Lead': return 'bg-gray-100 text-gray-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getServiceLabel = (type?: string) => {
        switch (type) {
            case 'Dispatch': return '派遣契約';
            case 'Recruitment': return '人材紹介';
            case 'Lead': return 'リード';
            default: return 'リード';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">顧客管理</h2>
                        <p className="text-xs text-gray-500">{filteredClients.length}件の顧客データ (Eight連携済み)</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="会社名、氏名で検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-gray-50 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                        />
                    </div>

                    {/* Filter Prefecture */}
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={selectedPrefecture}
                            onChange={(e) => setSelectedPrefecture(e.target.value)}
                            className="pl-9 pr-8 py-2 bg-gray-50 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                            <option value="all">全ての地域</option>
                            {prefectures.map(pref => (
                                <option key={pref} value={pref}>{pref}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filter Service */}
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={selectedService}
                            onChange={(e) => setSelectedService(e.target.value)}
                            className="pl-9 pr-8 py-2 bg-gray-50 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                            <option value="all">全てのステータス</option>
                            <option value="Lead">リード (Eight)</option>
                            <option value="Dispatch">派遣契約あり</option>
                            <option value="Recruitment">人材紹介契約あり</option>
                        </select>
                    </div>

                    <button className="btn btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">新規登録</span>
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredClients.map((client) => (
                    <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group overflow-hidden">
                        {/* Card Header colors based on prefecture or random? Let's use a subtle top border */}
                        <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

                        <div className="p-5">
                            <div className="flex justify-between items-start mb-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            {client.prefecture || '未設定'}
                                        </span>
                                        <span className={clsx(
                                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                            getServiceColor(client.serviceType)
                                        )}>
                                            {getServiceLabel(client.serviceType)}
                                        </span>
                                        {client.source === 'Eight' && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                                Eight
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                                        {client.companyName}
                                    </h3>
                                    {client.department && (
                                        <p className="text-xs text-gray-500 truncate max-w-[250px]">{client.department}</p>
                                    )}
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                                    {client.lastName[0]}{client.firstName[0]}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{client.lastName} {client.firstName}</p>
                                    <p className="text-xs text-gray-500">{client.position || '役職なし'}</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 mb-5">
                                {client.address && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2 text-xs">{client.address}</span>
                                    </div>
                                )}
                                {client.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                        <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline truncate">
                                            {client.email}
                                        </a>
                                    </div>
                                )}
                                {(client.phone || client.mobile) && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span>{client.mobile || client.phone}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {client.exchangeDate || '日付不明'}
                                </span>

                                <Link
                                    href={`/deals?create=true&clientId=${client.id}&clientName=${encodeURIComponent(client.companyName)}`}
                                    className="btn btn-sm btn-outline-primary flex items-center gap-1 text-xs px-3 py-1.5"
                                >
                                    <Briefcase className="w-3 h-3" />
                                    商談作成
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredClients.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">該当する顧客が見つかりませんでした</p>
                    <p className="text-xs text-gray-400 mt-1">検索条件を変更してみてください</p>
                </div>
            )}
        </div>
    );
}
