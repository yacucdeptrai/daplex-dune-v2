export interface AuditLogChange {
  key: string;
  oldValue?: string | number | boolean | null;
  newValue?: string | number | boolean | null;
}

export interface AuditLog {
  _id: string;
  user: string; // bigint serialized as string
  target: string; // bigint serialized as string
  targetRef: string;
  type: number;
  changes: AuditLogChange[];
  createdAt: string; // ISO string from backend
}

