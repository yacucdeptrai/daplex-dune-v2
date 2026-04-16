import { CursorPaginateDto } from '../common';

export interface CursorPageAuditLogDto extends CursorPaginateDto {
  type?: number | null;
  targetRef?: string | null;
  target?: string | null; // bigint as string
  user?: string | null; // bigint as string
  startDate?: string | null;
  endDate?: string | null;
}

