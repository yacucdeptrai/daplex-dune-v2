import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RecaptchaComponent } from '../../../../shared/components/recaptcha';
import { finalize, interval, Observable, takeUntil, takeWhile, tap } from 'rxjs';

import { AuthService, DestroyService } from '../../../../core/services';
import { SEND_RECOVERY_EMAIL_LIMIT_TTL } from '../../../../../environments/config';
import { TranslocoDirective } from '@jsverse/transloco';
import { ProgressBarModule } from 'primeng/progressbar';
import { NgClass, NgIf } from '@angular/common';
import { FormHandlerDirective } from '../../../../shared/directives/form-directive/form-handler/form-handler.directive';
import { DisabledControlDirective } from '../../../../shared/directives/form-directive/disabled-control/disabled-control.directive';
import { AutofocusDirective } from '../../../../shared/directives/form-directive/autofocus/autofocus.directive';
import { InputTextModule } from 'primeng/inputtext';
import { InvalidControlDirective } from '../../../../shared/directives/form-directive/invalid-control/invalid-control.directive';
import { RecaptchaComponent as RecaptchaComponent_1 } from '../../../../shared/components/recaptcha/recaptcha.component';
import { RecaptchaValueAccessorDirective } from '../../../../shared/components/recaptcha/recaptcha-value-accessor.directive';
import { ButtonModule } from 'primeng/button';
import { FirstErrorKeyPipe } from '../../../../shared/pipes/validation-pipe/first-error-key/first-error-key.pipe';
import { TimePipe } from '../../../../shared/pipes/date-time-pipe/time/time.pipe';

interface RecoverPasswordForm {
  email: FormControl<string>;
  captcha: FormControl<string>;
}

@Component({
    selector: 'app-forgot-password',
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DestroyService],
    imports: [TranslocoDirective, ProgressBarModule, NgClass, NgIf, FormsModule, ReactiveFormsModule, FormHandlerDirective, DisabledControlDirective, AutofocusDirective, InputTextModule, InvalidControlDirective, RecaptchaComponent_1, RecaptchaValueAccessorDirective, ButtonModule, RouterLink, FirstErrorKeyPipe, TimePipe]
})
export class ForgotPasswordComponent implements OnInit {
  @ViewChild('reCaptcha') reCaptcha?: RecaptchaComponent;
  recoverPasswordForm: FormGroup<RecoverPasswordForm>;
  success: boolean = false;
  canResendEmail: boolean = true;
  resendEmailTtl: number = 0;

  constructor(private ref: ChangeDetectorRef, private authService: AuthService, private router: Router,
    private destroyService: DestroyService) {
    this.recoverPasswordForm = new FormGroup<RecoverPasswordForm>({
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      captcha: new FormControl('', { nonNullable: true, validators: Validators.required })
    }, { updateOn: 'change' });
  }

  ngOnInit(): void {
    if (this.authService.currentUser) {
      this.router.navigate(['/']);
    }
  }

  onRecoverPasswordFormSubmit(): void {
    if (this.recoverPasswordForm.invalid)
      return;
    this.recoverPasswordForm.disable({ emitEvent: false });
    const formValue = this.recoverPasswordForm.getRawValue();
    this.authService.sendRecoveryEmail({
      email: formValue.email,
      captcha: formValue.captcha
    }).subscribe(() => {
      this.success = true;
      this.createRateLimitInterval().subscribe();
    }).add(() => {
      this.reCaptcha?.reset();
      this.recoverPasswordForm.enable({ emitEvent: false });
      this.ref.markForCheck();
    });
  }

  resendEmail(): void {
    if (this.recoverPasswordForm.invalid)
      return;
    this.recoverPasswordForm.disable({ emitEvent: false });
    const formValue = this.recoverPasswordForm.getRawValue();
    this.authService.sendRecoveryEmail({
      email: formValue.email,
      captcha: formValue.captcha
    }).subscribe(() => {
      this.createRateLimitInterval().subscribe();
    }).add(() => {
      this.reCaptcha?.reset();
      this.recoverPasswordForm.enable({ emitEvent: false });
      this.ref.markForCheck();
    });
  }

  createRateLimitInterval(): Observable<number> {
    this.canResendEmail = false;
    this.resendEmailTtl = SEND_RECOVERY_EMAIL_LIMIT_TTL;
    return interval(1000).pipe(
      tap(() => {
        this.resendEmailTtl -= 1;
        this.ref.markForCheck();
      }),
      finalize(() => {
        this.canResendEmail = true;
      }),
      takeWhile(() => this.resendEmailTtl > 0),
      takeUntil(this.destroyService)
    );
  }

}
