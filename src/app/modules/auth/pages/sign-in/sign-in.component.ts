import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { finalize, takeUntil, timer } from 'rxjs';
import { RecaptchaComponent } from '../../../../shared/components/recaptcha';

import { AuthService, DestroyService } from '../../../../core/services';
import { SIGN_IN_LIMIT_COUNT, SIGN_IN_LIMIT_TTL } from '../../../../../environments/config';
import { UserDetails } from '../../../../core/models';
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
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { FirstErrorKeyPipe } from '../../../../shared/pipes/validation-pipe/first-error-key/first-error-key.pipe';
import { SubstringPipe } from '../../../../shared/pipes/string-pipe/substring/substring.pipe';
import { ThumbhashUrlPipe } from '../../../../shared/pipes/placeholder-pipe/thumbhash-url/thumbhash-url.pipe';

interface SignInForm {
  email: FormControl<string>;
  password: FormControl<string>;
  captcha: FormControl<string | undefined | null>;
}

@Component({
    selector: 'app-sign-in',
    templateUrl: './sign-in.component.html',
    styleUrls: ['./sign-in.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DestroyService],
    imports: [TranslocoDirective, ProgressBarModule, NgClass, NgIf, FormsModule, ReactiveFormsModule, FormHandlerDirective, DisabledControlDirective, AutofocusDirective, InputTextModule, InvalidControlDirective, RecaptchaComponent_1, RecaptchaValueAccessorDirective, ButtonModule, RouterLink, LazyLoadImageModule, AvatarComponent, FirstErrorKeyPipe, SubstringPipe, ThumbhashUrlPipe]
})
export class SignInComponent implements OnInit {
  @ViewChild('reCaptcha') reCaptcha?: RecaptchaComponent;
  maxFailureCount: number = SIGN_IN_LIMIT_COUNT;
  continueUrl: string;
  signInForm: FormGroup<SignInForm>;
  failureCount: number = 0;
  currentUser: UserDetails | null = null;

  constructor(private ref: ChangeDetectorRef, private route: ActivatedRoute, private router: Router,
    private authService: AuthService, private destroyService: DestroyService) {
    this.signInForm = new FormGroup<SignInForm>({
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(128)] }),
      captcha: new FormControl(undefined)
    }, { updateOn: 'change' });
    this.continueUrl = this.route.snapshot.queryParams['continue'] || '/';
  }

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroyService)).subscribe(user => {
      this.currentUser = user;
      this.ref.markForCheck();
    });
  }

  onSignInFormSubmit(): void {
    if (this.signInForm.invalid)
      return;
    this.signInForm.disable({ emitEvent: false });
    this.authService.signIn(this.signInForm.getRawValue()).subscribe({
      next: () => this.router.navigate([this.continueUrl]),
      error: (error) => {
        if (error.status >= 400 && error.status <= 499 && error.status !== 429) {
          this.failureCount += 1;
        } else if (error.status === 429) {
          this.failureCount = this.maxFailureCount;
        }
        if (this.failureCount === this.maxFailureCount) {
          // Enable recaptcha now
          this.signInForm.controls.captcha.addValidators(Validators.required);
          this.removeCaptchaLater(error.error?.ttl || SIGN_IN_LIMIT_TTL);
        } else if (this.failureCount > this.maxFailureCount) {
          // Reset enabled recaptcha
          this.reCaptcha?.reset();
        }
      }
    }).add(() => {
      this.signInForm.enable({ emitEvent: false });
      this.ref.markForCheck();
    });
  }

  removeCaptchaLater(timeout: number): void {
    timer(timeout * 1000).pipe(
      finalize(() => {
        this.failureCount = 0;
        this.signInForm.controls.captcha.reset();
        this.signInForm.controls.captcha.clearValidators();
        this.signInForm.controls.captcha.setErrors(null);
        this.ref.markForCheck();
      }),
      takeUntil(this.destroyService)
    ).subscribe();
  }

  onSignOut(): void {
    this.authService.signOut().subscribe();
  }

}
