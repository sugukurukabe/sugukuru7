export interface KPIMetric {
    value: number;
    target?: number;
    achievement?: number;  // パーセント
    trend?: 'up' | 'down' | 'stable';
    changePercent?: number;
    previousValue?: number;
}

export interface CompanyKPI {
    period: string;
    periodLabel: string;

    summary: {
        revenue: KPIMetric;
        activeWorkers: KPIMetric;
        utilizationRate: KPIMetric;
        dealConversionRate: KPIMetric;
        newWorkers: KPIMetric;
        newClients: KPIMetric;
        noticeComplianceRate: KPIMetric;
    };

    byDivision: DivisionSummary[];

    trends: {
        revenue: TrendPoint[];
        workers: TrendPoint[];
    };
}

export interface DivisionSummary {
    division: string;
    divisionName: string;
    revenue: number;
    revenueShare: number;
    workers: number;
    utilizationRate: number;
}

export interface DivisionKPI {
    division: string;
    divisionName: string;
    icon: string;

    metrics: {
        revenue: KPIMetric;
        workers: KPIMetric;
        clients: KPIMetric;
        utilizationRate: KPIMetric;
        avgHourlyRate: KPIMetric;
    };

    topClients: {
        name: string;
        revenue: number;
        workers: number;
    }[];
}

export interface UserKPI {
    userId: string;
    userName: string;
    role: 'sales' | 'manager' | 'admin';
    period: string;

    metrics: {
        dealsManaged?: { value: number; wonCount: number; lostCount: number };
        conversionRate?: KPIMetric;
        newClients?: KPIMetric;
        revenue?: { value: number; contribution: number };

        // 管理担当向け
        workersManaged?: KPIMetric;
        noticesProcessed?: KPIMetric;
        complianceRate?: KPIMetric;
    };

    deals?: {
        dealName: string;
        status: string;
        value: number;
    }[];

    ranking?: {
        position: number;
        totalUsers: number;
        metric: string;
    };
}

export interface TrendPoint {
    month: string;
    value: number;
}
