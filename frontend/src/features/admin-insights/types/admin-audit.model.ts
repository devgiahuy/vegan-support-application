export interface AdminAuditRow {
  key: string;
  sourceLabel: string;
  actionLabel: string;
  actorLabel: string;
  targetLabel: string;
  targetId: string;
  occurredAt: string;
  timeLabel: string;
}

export interface AdminAuditPage {
  rows: AdminAuditRow[];
  nextCursor: string | null;
}
