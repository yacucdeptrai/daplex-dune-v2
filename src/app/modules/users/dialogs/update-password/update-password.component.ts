import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef, DynamicDialogModule } from 'primeng/dynamicdialog';
import { takeUntil } from 'rxjs';

import { RegexPattern } from '../../../../core/enums';
import { UserDetails } from '../../../../core/models';
import { DestroyService, UsersService } from '../../../../core/services';
import { controlMatches } from '../../../../core/validators';
import { TranslocoDirective } from '@jsverse/transloco';
import { FormHandlerDirective } from '../../../../shared/directives/form-directive/form-handler/form-handler.directive';
import { DisabledControlDirective } from '../../../../shared/directives/form-directive/disabled-control/disabled-control.directive';
import { AutofocusDirective } from '../../../../shared/directives/form-directive/autofocus/autofocus.directive';
import { InputTextModule } from 'primeng/inputtext';
import { InvalidControlDirective } from '../../../../shared/directives/form-directive/invalid-control/invalid-control.directive';
import { ButtonModule } from 'primeng/button';
import { FirstErrorKeyPipe } from '../../../../shared/pipes/validation-pipe/first-error-key/first-error-key.pipe';

interface UpdatePasswordForm {
  currentPassword: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}

@Component({
    selector: 'app-update-password',
    templateUrl: './update-password.component.html',
    styleUrls: ['./update-password.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DestroyService],
    imports: [DynamicDialogModule, TranslocoDirective, FormsModule, ReactiveFormsModule, FormHandlerDirective, DisabledControlDirective, AutofocusDirective, InputTextModule, InvalidControlDirective, ButtonModule, FirstErrorKeyPipe]
})
export class UpdatePasswordComponent {
  updatePasswordForm: FormGroup<UpdatePasswordForm>;
  showPassword: boolean = false;

  constructor(private ref: ChangeDetectorRef, private dialogRef: DynamicDialogRef,
    private config: DynamicDialogConfig<UserDetails>, private usersService: UsersService,
    private destroyService: DestroyService) {
    this.updatePasswordForm = new FormGroup<UpdatePasswordForm>({
      currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(128)] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8), Validators.maxLength(128), Validators.pattern(RegexPattern.ACCOUNT_PASSWORD)] }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required], updateOn: 'blur' })
    }, { validators: [controlMatches('confirmPassword', 'password')] });
  }

  onUpdatePasswordFormSubmit(): void {
    if (this.updatePasswordForm.invalid) return;
    this.updatePasswordForm.disable({ emitEvent: false });
    const formValue = this.updatePasswordForm.getRawValue();
    this.usersService.update(this.config.data!._id, {
      currentPassword: formValue.currentPassword,
      password: formValue.password
    }).pipe(takeUntil(this.destroyService)).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.updatePasswordForm.enable({ emitEvent: false });
        this.ref.markForCheck();
      }
    });
  }

  onUpdatePasswordFormCancel(): void {
    this.dialogRef.close();
  }
}
