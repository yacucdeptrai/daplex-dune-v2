import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { takeUntil } from 'rxjs';

import { UpdateCollectionDto } from '../../../../core/dto/collections';
import { MediaCollection } from '../../../../core/models';
import { CollectionService, DestroyService } from '../../../../core/services';
import { TranslocoDirective } from '@jsverse/transloco';
import { FormHandlerDirective } from '../../../../shared/directives/form-directive/form-handler/form-handler.directive';
import { DisabledControlDirective } from '../../../../shared/directives/form-directive/disabled-control/disabled-control.directive';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InvalidControlDirective } from '../../../../shared/directives/form-directive/invalid-control/invalid-control.directive';
import { ButtonModule } from 'primeng/button';
import { FirstErrorKeyPipe } from '../../../../shared/pipes/validation-pipe/first-error-key/first-error-key.pipe';
import { DialogDismissDirective } from '../../../../shared/directives/dialog-dismiss/dialog-dismiss.directive';

interface UpdateCollectionForm {
  name: FormControl<string>;
  overview: FormControl<string>;
}

@Component({
    selector: 'app-update-collection',
    templateUrl: './update-collection.component.html',
    styleUrls: ['./update-collection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DestroyService],
    hostDirectives: [DialogDismissDirective],
    imports: [TranslocoDirective, FormsModule, ReactiveFormsModule, FormHandlerDirective, DisabledControlDirective, InputTextModule, TextareaModule, InvalidControlDirective, ButtonModule, FirstErrorKeyPipe]
})
export class UpdateCollectionComponent implements OnInit {
  updateCollectionForm: FormGroup<UpdateCollectionForm>;

  constructor(private ref: ChangeDetectorRef, private dialogRef: DynamicDialogRef, private config: DynamicDialogConfig<MediaCollection>,
    private collectionService: CollectionService, private destroyService: DestroyService) {
    this.updateCollectionForm = new FormGroup<UpdateCollectionForm>({
      name: new FormControl(this.config.data!.name || '', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500)] }),
      overview: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(2000)] })
    }, { updateOn: 'change' });
    // Disabled until findOne hydrates the overview — submitting before then would abort on the
    // empty-overview minLength validator and silently drop the edit.
    this.updateCollectionForm.disable({ emitEvent: false });
  }

  ngOnInit(): void {
    // The list row carries only name + count; fetch the detail to pre-fill the overview.
    this.collectionService.findOne(this.config.data!._id).pipe(takeUntil(this.destroyService)).subscribe({
      next: collection => {
        this.updateCollectionForm.patchValue({ name: collection.name, overview: collection.overview });
        this.updateCollectionForm.enable({ emitEvent: false });
        this.ref.markForCheck();
      }
    });
  }

  onUpdateCollectionFormSubmit(): void {
    if (this.updateCollectionForm.invalid) return;
    this.updateCollectionForm.disable({ emitEvent: false });
    const formValue = this.updateCollectionForm.getRawValue();
    const params: UpdateCollectionDto = {
      name: formValue.name,
      overview: formValue.overview
    };
    this.collectionService.update(this.config.data!._id, params).pipe(takeUntil(this.destroyService)).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.updateCollectionForm.enable({ emitEvent: false });
        this.ref.markForCheck();
      }
    });
  }

  onUpdateCollectionFormCancel(): void {
    this.dialogRef.close(false);
  }

}
