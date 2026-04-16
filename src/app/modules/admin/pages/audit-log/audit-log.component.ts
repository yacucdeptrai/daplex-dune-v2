import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AuditLogDetailsComponent } from '../../dialogs/audit-log-details/audit-log-details.component';

import { CursorPageAuditLogDto } from '../../../../core/dto/audit-log';
import { AuditLog, CursorPaginated } from '../../../../core/models';
import { AuditLogService } from '../../../../core/services';

interface AuditLogFilterForm {
  type: FormControl<number | null>;
  targetRef: FormControl<string | null>;
  target: FormControl<string | null>; // bigint as string
  user: FormControl<string | null>; // bigint as string
  startDate: FormControl<string | null>; // YYYY-MM-DD
  endDate: FormControl<string | null>; // YYYY-MM-DD
}

@Component({
  selector: 'app-audit-log',
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class AuditLogComponent implements OnInit, OnDestroy {
  loadingAuditList: boolean = false;
  loadingMoreAuditList: boolean = false;
  auditLogsFailed: boolean = false;
  itemsPerPage: number = 30;

  auditLogList?: CursorPaginated<AuditLog>;

  filterForm: FormGroup<AuditLogFilterForm>;
  private activeFilters: Omit<CursorPageAuditLogDto, 'pageToken' | 'limit'> = {};
  private openDialogRefs: DynamicDialogRef[] = [];

  constructor(
    private ref: ChangeDetectorRef,
    private dialogService: DialogService,
    private auditLogService: AuditLogService
  ) {
    this.filterForm = new FormGroup<AuditLogFilterForm>({
      type: new FormControl<number | null>(null),
      targetRef: new FormControl<string | null>(null),
      target: new FormControl<string | null>(null),
      user: new FormControl<string | null>(null),
      startDate: new FormControl<string | null>(null),
      endDate: new FormControl<string | null>(null),
    });
  }

  ngOnInit(): void {
    this.onFilterSubmit();
  }

  ngOnDestroy(): void {
    this.openDialogRefs.forEach(ref => ref.close());
    this.openDialogRefs = [];
  }

  onFilterSubmit(): void {
    const formValue = this.filterForm.getRawValue();

    this.activeFilters = {
      type: formValue.type,
      targetRef: formValue.targetRef,
      target: formValue.target,
      user: formValue.user,
      startDate: formValue.startDate ? this.toIsoStartOfDayUtc(formValue.startDate) : undefined,
      endDate: formValue.endDate ? this.toIsoEndOfDayUtc(formValue.endDate) : undefined,
    };

    this.auditLogsFailed = false;
    this.auditLogList = undefined;
    this.loadAuditLogs(true);
  }

  clearFilters(): void {
    this.filterForm.reset({
      type: null,
      targetRef: null,
      target: null,
      user: null,
      startDate: null,
      endDate: null,
    });
    this.onFilterSubmit();
  }

  onScroll(): void {
    if (this.loadingMoreAuditList) return;
    if (!this.auditLogList?.hasNextPage || !this.auditLogList.nextPageToken) return;
    this.loadAuditLogs(false, this.auditLogList.nextPageToken);
  }

  showAuditLogDetails(log: AuditLog): void {
    const ref = this.dialogService.open(AuditLogDetailsComponent, {
      data: { id: log._id },
      width: '720px',
      modal: true,
      dismissableMask: true,
      styleClass: 'p-dialog-header-sm',
      header: 'Audit Log'
    });
    this.openDialogRefs.push(ref);
  }

  trackId(index: number, item: AuditLog): string {
    return item._id;
  }

  private loadAuditLogs(resetList: boolean, pageToken?: string): void {
    const dto: CursorPageAuditLogDto = {
      ...this.activeFilters,
      pageToken: resetList ? undefined : pageToken,
      limit: this.itemsPerPage
    };

    if (resetList) this.loadingAuditList = true;
    else this.loadingMoreAuditList = true;

    this.auditLogService.findPageCursor(dto).subscribe({
      next: (newList) => {
        if (!this.auditLogList || resetList) {
          this.auditLogList = {
            hasNextPage: newList.hasNextPage,
            nextPageToken: newList.nextPageToken,
            prevPageToken: newList.prevPageToken,
            totalResults: newList.totalResults,
            results: [...newList.results]
          };
          return;
        }

        if (this.auditLogList.nextPageToken === newList.nextPageToken &&
          this.auditLogList.prevPageToken === newList.prevPageToken) {
          return;
        }

        this.auditLogList = {
          ...this.auditLogList,
          hasNextPage: newList.hasNextPage,
          nextPageToken: newList.nextPageToken,
          prevPageToken: newList.prevPageToken,
          totalResults: newList.totalResults,
          results: [...this.auditLogList.results, ...newList.results]
        };
      },
      error: () => {
        this.auditLogsFailed = true;
        this.auditLogList = undefined;
      }
    }).add(() => {
      if (resetList) this.loadingAuditList = false;
      else this.loadingMoreAuditList = false;
      this.ref.markForCheck();
    });
  }

  private toIsoStartOfDayUtc(dateStr: string): string {
    // Convert "YYYY-MM-DD" into UTC midnight so server filtering is predictable.
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    return d.toJSON();
  }

  private toIsoEndOfDayUtc(dateStr: string): string {
    // Include the full end date.
    const d = new Date(`${dateStr}T23:59:59.999Z`);
    return d.toJSON();
  }
}

