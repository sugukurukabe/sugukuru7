export type BusinessDivision = 'dispatch' | 'subcontracting' | 'support' | 'it';

export const DIVISION_LABELS: Record<BusinessDivision, string> = {
    dispatch: '派遣事業',
    subcontracting: '農受託事業',
    support: '登録支援事業',
    it: 'IT事業'
};

export const DIVISION_ICONS: Record<BusinessDivision, string> = {
    dispatch: '🚜',
    subcontracting: '🌾',
    support: '📋',
    it: '💻'
};

export interface ClientSummary {
    org_id: string;
    name: string;
    workerCount: number;
    totalRevenue: number;
}

export interface RegionSummary {
    region: string;
    totalRevenue: number;
    clients: ClientSummary[];
}

export interface DivisionSummary {
    division: BusinessDivision;
    divisionName: string;
    divisionIcon: string;
    workerCount: number;
    totalRevenue: number;
    totalHours: number;
    percentage: number;
    regions: RegionSummary[];
}

export interface DailySummary {
    totalWorkers: number;
    totalRevenue: number;
    totalHours: number;
}

export interface DailyOperationsResponse {
    date: string;
    summary: DailySummary;
    divisions: DivisionSummary[];
}
