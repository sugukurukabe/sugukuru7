export type DealStatus = 'lead' | 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost' | 'on_hold';
export type ContractCategory = 'labor_dispatch' | 'subcontracting' | 'recruitment' | 'temp_to_perm';
export type ActivityType = 'call' | 'visit' | 'email' | 'proposal' | 'negotiation' | 'status_change';

export interface Deal {
    dealId: string;
    dealNumber: string;
    dealName: string;
    clientOrgId?: string;
    clientName: string;
    clientNameKana?: string;
    clientAddress?: string;
    clientPhone?: string;
    contractCategory: ContractCategory;
    jobDescription?: string;
    expectedStartDate?: string;
    expectedEndDate?: string;
    requiredHeadcount: number;
    filledHeadcount: number;
    hourlyRateNoLicense?: number;
    hourlyRateWithLicense?: number;
    status: DealStatus;
    probability: number;
    salesRepId?: string;
    salesRepName?: string;
    notes?: string;
    shoudanaRowId?: number;
    shoudanaSyncedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DealActivity {
    activityId: string;
    dealId: string;
    activityType: ActivityType;
    activityDate: string;
    description: string;
    outcome?: string;
    nextAction?: string;
    nextActionDate?: string;
    performedByName: string;
}

export interface KanbanColumn {
    status: DealStatus;
    statusName: string;
    color: string;
    deals: Deal[];
    totalCount: number;
}

export const DEAL_STATUS_CONFIG: Record<DealStatus, { name: string; color: string }> = {
    lead: { name: 'リード', color: '#94a3b8' },
    qualification: { name: 'ヒアリング', color: '#60a5fa' },
    proposal: { name: '提案中', color: '#fbbf24' },
    negotiation: { name: '交渉中', color: '#f97316' },
    won: { name: '成約', color: '#22c55e' },
    lost: { name: '失注', color: '#ef4444' },
    on_hold: { name: '保留', color: '#a855f7' }
};

export const CONTRACT_ICONS: Record<ContractCategory, string> = {
    labor_dispatch: '🚜',
    subcontracting: '🌾',
    recruitment: '📋',
    temp_to_perm: '🔄'
};
