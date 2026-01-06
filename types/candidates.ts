export type Availability = 'available' | 'ending_soon' | 'assigned';
export type Nationality = 'vietnam' | 'indonesia' | 'philippines' | 'myanmar' | 'china' | 'other';
export type Skill = 'forklift' | 'driver_license' | 'large_vehicle' | 'jlpt_n1' | 'jlpt_n2' | 'jlpt_n3';

export interface Candidate {
    personId: string;
    fullName: string;
    fullNameKana?: string;
    nationality: Nationality;
    nationalityName: string;
    age: number;

    visaType: string;
    visaTypeName: string;
    visaValidUntil?: string;
    daysUntilVisaExpiry?: number;

    availability: Availability;
    availabilityLabel: string;
    availableFrom?: string;
    currentAssignment?: {
        clientName: string;
        endDate: string;
    };

    skills: Skill[];
    skillLabels: string[];

    preferredRegions: string[];
    preferredRegionLabels: string[];

    expectedHourlyRate?: number;

    employmentHistory?: {
        totalMonths: number;
        lastClient?: string;
        lastEndDate?: string;
    };

    photoUrl?: string;
    phone?: string;
}

export interface CandidateSearchResponse {
    total: number;
    results: Candidate[];
    filters: {
        availabilities: FilterOption[];
        nationalities: FilterOption[];
        visaTypes: FilterOption[];
        skills: FilterOption[];
    };
}

export interface FilterOption {
    value: string;
    label: string;
    count: number;
}

export interface DealProposal {
    proposalId: string;
    dealId: string;
    dealName: string;
    personId: string;
    personName: string;
    proposedBy: string;
    proposedAt: string;
    status: 'proposed' | 'accepted' | 'rejected';
    notes?: string;
}

export const NATIONALITY_LABELS: Record<Nationality, string> = {
    vietnam: 'ベトナム',
    indonesia: 'インドネシア',
    philippines: 'フィリピン',
    myanmar: 'ミャンマー',
    china: '中国',
    other: 'その他'
};

export const SKILL_LABELS: Record<Skill, string> = {
    forklift: 'フォークリフト',
    driver_license: '普通免許',
    large_vehicle: '大型免許',
    jlpt_n1: '日本語N1',
    jlpt_n2: '日本語N2',
    jlpt_n3: '日本語N3'
};

export const AVAILABILITY_CONFIG: Record<Availability, { label: string; color: string; icon: string }> = {
    available: { label: '即日可', color: '#22c55e', icon: '🟢' },
    ending_soon: { label: 'まもなく空き', color: '#eab308', icon: '🟡' },
    assigned: { label: '配置中', color: '#94a3b8', icon: '⚪' }
};
