import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, input, output, effect } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslocoService, TranslocoTranslateFn } from '@jsverse/transloco';
import { SharedModule } from 'primeng/api';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { takeUntil } from 'rxjs';
import { cloneDeep } from 'lodash-es';

import { MediaDetails, Genre, MediaCollection, Production, Tag } from '../../../../../../core/models';
import { DestroyService, ItemDataService, MediaService } from '../../../../../../core/services';
import { EditMediaForm, MediaFormHelperService } from '../../../../../../core/services/media-form-helper.service';
import { DropdownOptionDto } from '../../../../../../core/dto/media';
import { detectFormChange } from '../../../../../../core/utils';
import { MediaStatus, MediaType } from '../../../../../../core/enums';
import { ButtonModule } from 'primeng/button';
import { FormHandlerDirective } from '../../../../../../shared/directives/form-directive/form-handler/form-handler.directive';
import { DisabledControlDirective } from '../../../../../../shared/directives/form-directive/disabled-control/disabled-control.directive';
import { InputTextModule } from 'primeng/inputtext';
import { InvalidControlDirective } from '../../../../../../shared/directives/form-directive/invalid-control/invalid-control.directive';
import { TextareaModule } from 'primeng/textarea';
import { InputMaskModule } from 'primeng/inputmask';
import { SelectModule } from 'primeng/select';
import { AltAutoComplete } from '../../../../../../core/utils/primeng/autocomplete';
import { ChipModule } from 'primeng/chip';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FirstErrorKeyPipe } from '../../../../../../shared/pipes/validation-pipe/first-error-key/first-error-key.pipe';

// General/edit-form tab extracted from ConfigureMediaComponent. Owns all form state + logic and renders
// the <form id="update-media-form"> body; the parent keeps the appPanelToast footer (content-projection
// can't cross the component boundary) and binds the exposed updateMediaForm / updateMediaFormChanged /
// onUpdateMediaFormReset via #formCmp, with the submit button bridging through the native
// form="update-media-form" association. Patches reactively from the media input (re-arms the dirty
// watcher, re-snapshots the init value); a socket refresh of media re-patches and clears the dirty
// footer — current behavior preserved. Submit emits the full saved media via mediaChange (no shared-state
// mutation) + updated. DestroyService is the per-component teardown token (provided here, not the NG0201
// trap); ItemDataService resolves up-tree. parentDialogRef parity-only (the form opens no nested dialog).
@Component({
  selector: 'app-configure-media-form',
  templateUrl: './configure-media-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  imports: [FormsModule, ReactiveFormsModule, FormHandlerDirective, DisabledControlDirective, InputTextModule, InvalidControlDirective, TextareaModule, InputMaskModule, SelectModule, AltAutoComplete, SharedModule, ChipModule, RadioButtonModule, ToggleSwitchModule, ButtonModule, FirstErrorKeyPipe]
})
export class ConfigureMediaFormComponent implements OnInit {
  MediaType = MediaType;
  MediaStatus = MediaStatus;

  media = input.required<MediaDetails>();
  t = input.required<TranslocoTranslateFn>();
  parentDialogRef = input.required<DynamicDialogRef>();
  mediaChange = output<MediaDetails>();
  updated = output<void>();

  updateMediaFormChanged: boolean = false;
  updateMediaForm: FormGroup<EditMediaForm>;
  updateMediaInitValue: {} = {};
  days: DropdownOptionDto[] = [];
  months: DropdownOptionDto[] = [];
  years: DropdownOptionDto[] = [];
  languages: DropdownOptionDto[] = [];
  genreSuggestions: Genre[] = [];
  productionSuggestions: Production[] = [];
  tagSuggestions: Tag[] = [];
  collectionSuggestions: MediaCollection[] = [];

  private tvControlsAdded: boolean = false;

  constructor(private ref: ChangeDetectorRef, private mediaService: MediaService,
    private itemDataService: ItemDataService, private mediaFormHelper: MediaFormHelperService,
    private destroyService: DestroyService) {
    this.updateMediaForm = this.mediaFormHelper.buildEditMediaForm();

    // Patch the form reactively whenever media arrives/changes (initial load + socket REFRESH_MEDIA).
    // TV-only controls are added on the first patch (guarded) so the per-type form shape + DTO shape
    // match the pre-split behavior, even though the signal input is unavailable at construction.
    effect(() => {
      const media = this.media();
      if (!media) return;
      this.patchUpdateMediaForm(media);
    });
  }

  ngOnInit(): void {
    const { days, months, years } = this.mediaFormHelper.buildDateLists(this.itemDataService);
    this.days = days;
    this.months = months;
    this.years = years;
    this.mediaFormHelper.createLanguageList(this.itemDataService).subscribe(languages => this.languages = languages);
  }

  loadGenreSuggestions(search?: string): void {
    this.mediaFormHelper.findGenreSuggestions(search).subscribe({
      next: genres => this.genreSuggestions = genres
    }).add(() => this.ref.markForCheck());
  }

  loadProductionSuggestions(search?: string): void {
    this.mediaFormHelper.findProductionSuggestions(search).subscribe({
      next: productions => this.productionSuggestions = productions
    }).add(() => this.ref.markForCheck());
  }

  loadTagSuggestions(search?: string): void {
    this.mediaFormHelper.findTagSuggestions(search).subscribe({
      next: tags => this.tagSuggestions = tags
    }).add(() => this.ref.markForCheck());
  }

  loadCollectionSuggestions(search?: string): void {
    this.mediaFormHelper.findCollectionSuggestions(search).subscribe({
      next: collections => this.collectionSuggestions = collections
    }).add(() => this.ref.markForCheck());
  }

  onUpdateMediaFormSubmit(): void {
    const media = this.media();
    if (!media || this.updateMediaForm.invalid) return;
    this.updateMediaForm.disable({ emitEvent: false });
    const mediaId = media._id;
    const formValue = this.updateMediaForm.getRawValue();
    const updateMediaDto = this.mediaFormHelper.toUpdateMediaDto(formValue, media, { editOnlyFields: true });
    this.mediaService.update(mediaId, updateMediaDto).pipe(takeUntil(this.destroyService)).subscribe(media => {
      this.mediaChange.emit(media);
      this.detectUpdateMediaFormChange();
      this.updated.emit();
    }).add(() => {
      this.updateMediaForm.enable({ emitEvent: false });
      this.ref.markForCheck();
    });
  }

  onUpdateMediaFormReset(): void {
    this.updateMediaForm.reset(this.updateMediaInitValue);
    this.detectUpdateMediaFormChange();
  }

  patchUpdateMediaForm(media: MediaDetails): void {
    this.tvControlsAdded = this.mediaFormHelper.patchEditMediaForm(this.updateMediaForm, media, this.tvControlsAdded);
    this.updateMediaInitValue = cloneDeep(this.updateMediaForm.value);
    this.detectUpdateMediaFormChange();
  }

  detectUpdateMediaFormChange(): void {
    detectFormChange(this.updateMediaForm, this.updateMediaInitValue, () => {
      this.updateMediaFormChanged = false;
    }, () => {
      this.updateMediaFormChanged = true;
    }).pipe(takeUntil(this.destroyService)).subscribe();
  }
}
