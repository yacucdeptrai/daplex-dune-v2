import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { takeUntil } from 'rxjs';

import { CreatePlaylistForm } from '../../../../core/interfaces/forms';
import { DestroyService, PlaylistsService } from '../../../../core/services';
import { TranslocoDirective } from '@ngneat/transloco';
import { FormHandlerDirective } from '../../../../shared/directives/form-directive/form-handler/form-handler.directive';
import { DisabledControlDirective } from '../../../../shared/directives/form-directive/disabled-control/disabled-control.directive';
import { InputTextModule } from 'primeng/inputtext';
import { InvalidControlDirective } from '../../../../shared/directives/form-directive/invalid-control/invalid-control.directive';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { FirstErrorKeyPipe } from '../../../../shared/pipes/validation-pipe/first-error-key/first-error-key.pipe';

interface CreatePlaylistWithDescForm extends CreatePlaylistForm {
  description: FormControl<string | null>;
}

@Component({
    selector: 'app-create-playlist',
    templateUrl: './create-playlist.component.html',
    styleUrls: ['./create-playlist.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [PlaylistsService, DestroyService],
    imports: [TranslocoDirective, FormsModule, ReactiveFormsModule, FormHandlerDirective, DisabledControlDirective, InputTextModule, InvalidControlDirective, InputTextareaModule, RadioButtonModule, ButtonModule, FirstErrorKeyPipe]
})
export class CreatePlaylistComponent {
  createPlaylistForm: FormGroup<CreatePlaylistWithDescForm>;

  constructor(private ref: ChangeDetectorRef, private dialogRef: DynamicDialogRef, private playlistsService: PlaylistsService,
    private destroyService: DestroyService) {
    this.createPlaylistForm = new FormGroup<CreatePlaylistWithDescForm>({
      name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
      description: new FormControl(null, { validators: Validators.maxLength(2000) }),
      visibility: new FormControl(1, { nonNullable: true, validators: Validators.required })
    });
  }

  onCreatePlaylistFormSubmit(): void {
    if (this.createPlaylistForm.invalid) return;
    this.createPlaylistForm.disable({ emitEvent: false });
    const formValue = this.createPlaylistForm.getRawValue();
    this.playlistsService.create({
      name: formValue.name,
      description: formValue.description,
      visibility: formValue.visibility
    }).pipe(takeUntil(this.destroyService)).subscribe({
      next: (playlist) => this.dialogRef.close(playlist),
      error: () => {
        this.createPlaylistForm.enable({ emitEvent: false });
        this.ref.markForCheck();
      }
    });
  }

  onCreatePlaylistFormCancel(): void {
    this.dialogRef.close(false);
  }
}
