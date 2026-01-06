export type DocType =
    | 'resident_card'
    | 'photo'
    | 'passport'
    | 'my_number'
    | 'health_checkup'
    | 'tax_certificate'
    | 'bank_account'
    | 'employment_contract'
    | 'dispatch_contract'
    | 'support_plan'
    | 'training_plan'
    | 'driver_license'
    | 'qualification'
    | 'other';

export type DocStatus = 'valid' | 'expiring' | 'expired' | 'missing';
export type DocSource = 'upload' | 'slack' | 'generated';

export interface Document {
    documentId: string;
    docType: DocType;
    docTypeName: string;

    fileName: string;
    fileSize: number;
    mimeType: string;
    filePath: string;

    validUntil?: string;
    daysUntilExpiry?: number;
    status: DocStatus;

    source: DocSource;
    slackFileId?: string;

    uploadedAt: string;
    uploadedBy?: string;

    thumbnailUrl?: string;
    notes?: string;
}

export interface ChecklistItem {
    docType: DocType;
    docTypeName: string;
    required: boolean;
    status: DocStatus;
    document?: Document;
    validUntil?: string;
    daysUntilExpiry?: number;
    validityMonths?: number;
    renewalNeeded?: boolean;
}

export interface DocumentChecklist {
    personId: string;
    personName: string;
    visaType: string;
    visaTypeName: string;

    completionRate: number;
    checklist: ChecklistItem[];

    summary: {
        required: { total: number; submitted: number; missing: number };
        optional: { total: number; submitted: number; missing: number };
        expiring: number;
        expired: number;
    };
}

export const DOC_TYPE_LABELS: Record<DocType, string> = {
    resident_card: '在留カード',
    photo: '顔写真',
    passport: 'パスポート',
    my_number: 'マイナンバーカード',
    health_checkup: '健康診断書',
    tax_certificate: '納税証明書',
    bank_account: '銀行口座情報',
    employment_contract: '雇用契約書',
    dispatch_contract: '派遣契約書',
    support_plan: '支援計画書',
    training_plan: '実習計画書',
    driver_license: '運転免許証',
    qualification: '資格証明書',
    other: 'その他'
};
