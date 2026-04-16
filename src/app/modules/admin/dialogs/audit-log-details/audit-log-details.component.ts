import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { AuditLogService } from '../../../../core/services';
import { AuditLog, AuditLogChange } from '../../../../core/models';

interface AuditLogDetailsDialogData {
  id: string;
}

@Component({
  selector: 'app-audit-log-details',
  templateUrl: './audit-log-details.component.html',
  styleUrls: ['./audit-log-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class AuditLogDetailsComponent implements OnInit {
  loading: boolean = true;
  auditLog?: AuditLog;

  constructor(
    private ref: ChangeDetectorRef,
    private dialogRef: DynamicDialogRef,
    private config: DynamicDialogConfig<AuditLogDetailsDialogData>,
    private auditLogService: AuditLogService
  ) { }

  ngOnInit(): void {
    const id = this.config.data?.id;
    if (!id) {
      this.loading = false;
      this.ref.markForCheck();
      return;
    }

    this.auditLogService.findOne(id).subscribe({
      next: log => {
        this.auditLog = log;
        this.loading = false;
        this.ref.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.ref.markForCheck();
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  trackChange(index: number, change: AuditLogChange): string {
    return `${index}:${change.key}`;
  }
}

