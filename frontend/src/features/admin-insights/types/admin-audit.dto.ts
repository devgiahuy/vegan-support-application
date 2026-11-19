export interface AdminAuditRequestDto {
  cursor?: string;
}

export interface AdminAuditItemDto {
  id?: string;
  source?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  actor?: { id?: string; displayName?: string | null } | null;
  occurredAt?: string;
}

export interface AdminAuditPageDto {
  items?: AdminAuditItemDto[];
  nextCursor?: string | null;
}

export interface AdminAuditResponseDto {
  success: true;
  data: AdminAuditPageDto;
}
