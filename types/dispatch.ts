import { BusinessDivision } from './operations';

export interface WorkerSlot {
    personId: string;
    name: string;
    slotId: string;
}

export interface DaySlot {
    workers: WorkerSlot[];
    count: number;
    required: number;
    status: 'fulfilled' | 'partial' | 'shortage';
}

export interface ClientDispatchRow {
    clientOrgId: string;
    clientName: string;
    region: string;
    businessDivision: BusinessDivision;
    requiredWorkers: number;
    slots: Record<string, DaySlot>; // ISO date string -> DaySlot
}

export interface DispatchSummary {
    totalRequired: number;
    totalAssigned: number;
    fulfillmentRate: number;
}

export interface DispatchGridResponse {
    weekStart: string;
    weekEnd: string;
    clients: ClientDispatchRow[];
    summary: DispatchSummary;
}

export interface AvailableWorker {
    personId: string;
    name: string;
    nationality: string;
    availableFrom: string;
    skills: string[];
}

export interface SimulationChange {
    action: 'add' | 'remove' | 'move';
    personId: string;
    personName: string;
    fromClientId?: string;
    toClientId?: string;
    date: string;
}

export interface SimulationSession {
    sessionId: string;
    sessionName: string;
    weekStart: string;
    status: 'draft' | 'reviewing' | 'applied' | 'discarded';
    changes: SimulationChange[];
    createdAt: string;
}
