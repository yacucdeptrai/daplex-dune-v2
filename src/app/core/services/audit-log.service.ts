import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { HttpParamsObject } from '../types/http-params.type';
import { CursorPageAuditLogDto } from '../dto/audit-log';
import { AuditLog, CursorPaginated } from '../models';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  constructor(private http: HttpClient) { }

  findPageCursor(cursorPageAuditLogDto: CursorPageAuditLogDto) {
    const params: HttpParamsObject = {};
    const {
      pageToken,
      limit,
      type,
      targetRef,
      target,
      user,
      startDate,
      endDate,
      sort
    } = cursorPageAuditLogDto;

    pageToken && (params['pageToken'] = pageToken);
    limit && (params['limit'] = limit);

    // Explicit null/undefined checks so "0" remains a valid value.
    type !== null && type !== undefined && (params['type'] = type);
    targetRef && (params['targetRef'] = targetRef);
    target && (params['target'] = target);
    user && (params['user'] = user);

    startDate && (params['startDate'] = startDate);
    endDate && (params['endDate'] = endDate);
    sort && (params['sort'] = sort);

    return this.http.get<CursorPaginated<AuditLog>>('audit-log/cursor', { params });
  }

  findOne(id: string) {
    return this.http.get<AuditLog>(`audit-log/${id}`);
  }
}

