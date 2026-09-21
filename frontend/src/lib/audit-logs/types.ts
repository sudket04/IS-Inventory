export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AuditLogListItem {
  auditId: number;
  occurredAt: string;
  userId: number | null;
  usernameSnapshot: string | null;
  action: string;
  entityType: string | null;
  entityId: number | null;
  entityLabel: string | null;
  changedFields: string | null;
  ipAddress: string | null;
}

export interface AuditLogDetail extends AuditLogListItem {
  beforeJson: string | null;
  afterJson: string | null;
  userAgent: string | null;
  batchUid: string | null;
}
