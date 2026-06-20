import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef, DynamicDialogModule } from 'primeng/dynamicdialog';
import { takeUntil } from 'rxjs';

import { DropdownOptionDto } from '../../../../core/dto/media';
import { Production } from '../../../../core/models';
import { DestroyService, ItemDataService, ProductionsService } from '../../../../core/services';
import { TranslocoDirective } from '@jsverse/transloco';
import { FormHandlerDirective } from '../../../../shared/directives/form-directive/form-handler/form-handler.directive';
import { DisabledControlDirective } from '../../../../shared/directives/form-directive/disabled-control/disabled-control.directive';
import { InputTextModule } from 'primeng/inputtext';
import { InvalidControlDirective } from '../../../../shared/directives/form-directive/invalid-control/invalid-control.directive';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { FirstErrorKeyPipe } from '../../../../shared/pipes/validation-pipe/first-error-key/first-error-key.pipe';
import { DialogDismissDirective } from '../../../../shared/directives/dialog-dismiss/dialog-dismiss.directive';

interface UpdateProductionForm {
  name: FormControl<string>;
  country: FormControl<string | null>;
}

@Component({
    selector: 'app-update-production',
    templateUrl: './update-production.component.html',
    styleUrls: ['./update-production.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ItemDataService, DestroyService],
    hostDirectives: [DialogDismissDirective],
    imports: [DynamicDialogModule, TranslocoDirective, FormsModule, ReactiveFormsModule, FormHandlerDirective, DisabledControlDirective, InputTextModule, InvalidControlDirective, SelectModule, ButtonModule, FirstErrorKeyPipe]
})
export class UpdateProductionComponent implements OnInit {
  isUpdatingProduction: boolean = false;
  updateProductionForm: FormGroup<UpdateProductionForm>;
  countryOptions?: DropdownOptionDto[];

  constructor(private ref: ChangeDetectorRef, private dialogRef: DynamicDialogRef, private config: DynamicDialogConfig<Production>,
    private productionsService: ProductionsService, private itemDataService: ItemDataService,
    private destroyService: DestroyService) {
    this.updateProductionForm = new FormGroup<UpdateProductionForm>({
      name: new FormControl(this.config.data!.name || '', { nonNullable: true, validators: [Validators.required, Validators.maxLength(150)] }),
      country: new FormControl(this.config.data!.country || null)
    }, { updateOn: 'change' });
  }

  ngOnInit(): void {
    this.itemDataService.createCountryList().subscribe({
      next: countries => this.countryOptions = countries
    });
  }

  onUpdateProductionFormSubmit(): void {
    if (this.updateProductionForm.invalid) return;
    this.isUpdatingProduction = true;
    const formValue = this.updateProductionForm.getRawValue();
    this.productionsService.update(this.config.data!._id, {
      name: formValue.name,
      country: formValue.country
    }).pipe(takeUntil(this.destroyService)).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.isUpdatingProduction = false;
        this.ref.markForCheck();
      }
    });
  }

  onUpdateProductionFormCancel(): void {
    this.dialogRef.close(false);
  }

}
