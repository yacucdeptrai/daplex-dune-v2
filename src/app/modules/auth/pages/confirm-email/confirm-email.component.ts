import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgIf } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-confirm-email',
    templateUrl: './confirm-email.component.html',
    styleUrls: ['./confirm-email.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslocoDirective, NgIf, ProgressSpinnerModule, RouterLink, ButtonModule]
})
export class ConfirmEmailComponent implements OnInit {
  id: string | null;
  activationCode: string | null;
  loading: boolean = false;
  success: boolean = false;

  constructor(private ref: ChangeDetectorRef, private route: ActivatedRoute, private authService: AuthService) {
    this.id = this.route.snapshot.queryParamMap.get('id');
    this.activationCode = this.route.snapshot.queryParamMap.get('code');
  }

  ngOnInit(): void {
    if (!this.id || !this.activationCode)
      return;
    this.loading = true;
    this.ref.markForCheck();
    this.authService.confirmEmail({
      id: this.id,
      activationCode: this.activationCode
    }).subscribe({
      next: () => {
        this.success = true;
      },
      error: () => {
        this.success = false;
      }
    }).add(() => {
      this.loading = false;
      this.ref.markForCheck();
    });
  }

}
