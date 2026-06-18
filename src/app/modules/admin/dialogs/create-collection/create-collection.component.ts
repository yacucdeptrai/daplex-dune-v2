import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { takeUntil } from 'rxjs';

import { CollectionService, DestroyService } from '../../../../core/services';
import { TranslocoDirective } from '@jsverse/transloco';
import { FormHandlerDirective } from '../../../../shared/directives/form-directive/form-handler/form-handler.directive';
import { DisabledControlDirective } from '../../../../shared/directives/form-directive/disabled-control/disabled-control.directive';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InvalidControlDirective } from '../../../../shared/directives/form-directive/invalid-control/invalid-control.directive';
import { ButtonModule } from 'primeng/button';
import { FirstErrorKeyPipe } from '../../../../shared/pipes/validation-pipe/first-error-key/first-error-key.pipe';

interface CreateCollectionForm {
  name: FormControl<string>;
  overview: FormControl<string>;
}

@Component({
    selector: 'app-create-collection',
    templateUrl: './create-collection.component.html',
    styleUrls: ['./create-collection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DestroyService],
    imports: [TranslocoDirective, FormsModule, ReactiveFormsModule, FormHandlerDirective, DisabledControlDirective, InputTextModule, TextareaModule, InvalidControlDirective, ButtonModule, FirstErrorKeyPipe]
})
export class CreateCollectionComponent {
  createCollectionForm: FormGroup<CreateCollectionForm>;

  constructor(private ref: ChangeDetectorRef, private dialogRef: DynamicDialogRef, private collectionService: CollectionService,
    private destroyService: DestroyService) {
    this.createCollectionForm = new FormGroup<CreateCollectionForm>({
      name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500)] }),
      overview: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(2000)] })
    }, { updateOn: 'change' });
  }

  onCreateCollectionFormSubmit(): void {
    if (this.createCollectionForm.invalid) return;
    this.createCollectionForm.disable({ emitEvent: false });
    const formValue = this.createCollectionForm.getRawValue();
    this.collectionService.create({
      name: formValue.name,
      overview: formValue.overview
    }).pipe(takeUntil(this.destroyService)).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.createCollectionForm.enable({ emitEvent: false });
        this.ref.markForCheck();
      }
    });
  }

  onCreateCollectionFormCancel(): void {
    this.dialogRef.close(false);
  }

}
