export type NoticeType =
    | 'zuitoji_dispatch_change'
    | 'zuitoji_termination'
    | 'zuitoji_new_employment'
    | 'quarterly_report'
    | 'annual_report';

export type NoticeStatus =
    | 'pending'
    | 'generating'
    | 'generated'
    | 'downloaded'
    | 'submitted'
    | 'accepted'
    | 'rejected'
    | 'cancelled';

export interface ImmigrationNotice {
    noticeId: string;
    noticeType: NoticeType;
    noticeTypeName: string;

    personId: string;
    personName: string;
    residenceCardNumber?: string;

    eventDate: string;
    deadline: string;
    daysUntilDeadline: number;

    previousClientName?: string;
    newClientName?: string;

    status: NoticeStatus;

    generatedDocument?: {
        documentId: string;
        fileName: string;
        filePath: string;
        generatedAt: string;
    };

    submittedAt?: string;
    submissionMethod?: 'online' | 'mail' | 'in_person';
    receiptNumber?: string;

    createdAt: string;
    updatedAt: string;
}

export const NOTICE_TYPE_LABELS: Record<NoticeType, string> = {
    zuitoji_dispatch_change: '随時届出（派遣先変更）',
    zuitoji_termination: '随時届出（契約終了）',
    zuitoji_new_employment: '随時届出（新規雇用）',
    quarterly_report: '定期届出（四半期）',
    annual_report: '定期届出（年次）'
};

export const NOTICE_STATUS_CONFIG: Record<NoticeStatus, { label: string; color: string; icon: string }> = {
    pending: { label: '生成待ち', color: '#94a3b8', icon: '⏳' },
    generating: { label: '生成中', color: '#60a5fa', icon: '⚙️' },
    generated: { label: '生成済み', color: '#fbbf24', icon: '📝' },
    downloaded: { label: 'DL済み', color: '#f97316', icon: '📥' },
    submitted: { label: '提出済み', color: '#22c55e', icon: '✅' },
    accepted: { label: '受理', color: '#10b981', icon: '✓' },
    rejected: { label: '却下', color: '#ef4444', icon: '❌' },
    cancelled: { label: 'キャンセル', color: '#6b7280', icon: '🚫' }
};
