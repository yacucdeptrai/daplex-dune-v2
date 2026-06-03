import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef, DynamicDialogModule } from 'primeng/dynamicdialog';
import { takeUntil } from 'rxjs';

import { UserDetails } from '../../../../core/models';
import { DestroyService, UsersService } from '../../../../core/services';
import { TranslocoDirective } from '@ngneat/transloco';
import { FormHandlerDirective } from '../../../../shared/directives/form-directive/form-handler/form-handler.directive';
import { DisabledControlDirective } from '../../../../shared/directives/form-directive/disabled-control/disabled-control.directive';
import { AutofocusDirective } from '../../../../shared/directives/form-directive/autofocus/autofocus.directive';
import { InputTextModule } from 'primeng/inputtext';
import { InvalidControlDirective } from '../../../../shared/directives/form-directive/invalid-control/invalid-control.directive';
import { ButtonModule } from 'primeng/button';
import { FirstErrorKeyPipe } from '../../../../shared/pipes/validation-pipe/first-error-key/first-error-key.pipe';

interface UpdateUsernameForm {
  username: FormControl<string>;
  currentPassword: FormControl<string>;
}

@Component({
    selector: 'app-update-username',
    templateUrl: './update-username.component.html',
    styleUrls: ['./update-username.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DestroyService],
    imports: [DynamicDialogModule, TranslocoDirective, FormsModule, ReactiveFormsModule, FormHandlerDirective, DisabledControlDirective, AutofocusDirective, InputTextModule, InvalidControlDirective, ButtonModule, FirstErrorKeyPipe]
})
export class UpdateUsernameComponent {
  updateUsernameForm: FormGroup<UpdateUsernameForm>;

  constructor(private ref: ChangeDetectorRef, private dialogRef: DynamicDialogRef,
    private config: DynamicDialogConfig<UserDetails>, private usersService: UsersService,
    private destroyService: DestroyService) {
    this.updateUsernameForm = new FormGroup<UpdateUsernameForm>({
      username: new FormControl(this.config.data!.username || '', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(32)] }),
      currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(128)] })
    });
  }

  onUpdateUsernameFormSubmit(): void {
    if (this.updateUsernameForm.invalid) return;
    this.updateUsernameForm.disable({ emitEvent: false });
    const formValue = this.updateUsernameForm.getRawValue();
    this.usersService.update(this.config.data!._id, {
      username: formValue.username,
      currentPassword: formValue.currentPassword
    }).pipe(takeUntil(this.destroyService)).subscribe({
      next: (user) => this.dialogRef.close(user.username),
      error: () => {
        this.updateUsernameForm.enable({ emitEvent: false });
        this.ref.markForCheck();
      }
    });
  }

  onUpdateUsernameFormCancel(): void {
    this.dialogRef.close();
  }
}
