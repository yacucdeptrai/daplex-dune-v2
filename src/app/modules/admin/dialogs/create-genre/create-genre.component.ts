import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { takeUntil } from 'rxjs';

import { DestroyService, GenresService } from '../../../../core/services';
import { TranslocoDirective } from '@ngneat/transloco';
import { FormHandlerDirective } from '../../../../shared/directives/form-directive/form-handler/form-handler.directive';
import { DisabledControlDirective } from '../../../../shared/directives/form-directive/disabled-control/disabled-control.directive';
import { InputTextModule } from 'primeng/inputtext';
import { InvalidControlDirective } from '../../../../shared/directives/form-directive/invalid-control/invalid-control.directive';
import { ButtonModule } from 'primeng/button';
import { FirstErrorKeyPipe } from '../../../../shared/pipes/validation-pipe/first-error-key/first-error-key.pipe';

interface CreateGenreForm {
  name: FormControl<string>;
}

@Component({
    selector: 'app-create-genre',
    templateUrl: './create-genre.component.html',
    styleUrls: ['./create-genre.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DestroyService],
    imports: [TranslocoDirective, FormsModule, ReactiveFormsModule, FormHandlerDirective, DisabledControlDirective, InputTextModule, InvalidControlDirective, ButtonModule, FirstErrorKeyPipe]
})
export class CreateGenreComponent {
  createGenreForm: FormGroup<CreateGenreForm>;

  constructor(private ref: ChangeDetectorRef, private dialogRef: DynamicDialogRef, private genresService: GenresService,
    private destroyService: DestroyService) {
    this.createGenreForm = new FormGroup<CreateGenreForm>({
      name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(32)] })
    }, { updateOn: 'change' });
  }

  onCreateGenreFormSubmit(): void {
    if (this.createGenreForm.invalid) return;
    this.createGenreForm.disable({ emitEvent: false });
    const formValue = this.createGenreForm.getRawValue();
    this.genresService.create({
      name: formValue.name
    }).pipe(takeUntil(this.destroyService)).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.createGenreForm.enable({ emitEvent: false });
        this.ref.markForCheck();
      }
    });
  }

  onCreateGenreFormCancel(): void {
    this.dialogRef.close(false);
  }

}
