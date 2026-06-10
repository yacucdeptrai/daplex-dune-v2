import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, input, output, effect } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslocoService, TranslocoTranslateFn } from '@jsverse/transloco';
import { SharedModule } from 'primeng/api';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { takeUntil } from 'rxjs';
import { cloneDeep } from 'lodash-es';

import { MediaDetails, Genre, Production, Tag } from '../../../../../../core/models';
import { DestroyService, GenresService, ItemDataService, MediaService, ProductionsService, TagsService } from '../../../../../../core/services';
import { DropdownOptionDto, UpdateMediaDto } from '../../../../../../core/dto/media';
import { shortDate } from '../../../../../../core/validators';
import { ExternalIdsForm, MediaScannerForm, ShortDateForm } from '../../../../../../core/interfaces/forms';
import { detectFormChange, timeStringToSeconds, secondsToTimeString } from '../../../../../../core/utils';
import { MediaStatus, MediaType } from '../../../../../../core/enums';
import { ButtonModule } from 'primeng/button';
import { FormHandlerDirective } from '../../../../../../shared/directives/form-directive/form-handler/form-handler.directive';
import { DisabledControlDirective } from '../../../../../../shared/directives/form-directive/disabled-control/disabled-control.directive';
import { InputTextModule } from 'primeng/inputtext';
import { InvalidControlDirective } from '../../../../../../shared/directives/form-directive/invalid-control/invalid-control.directive';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputMaskModule } from 'primeng/inputmask';
import { DropdownModule } from 'primeng/dropdown';
import { AltAutoComplete } from '../../../../../../core/utils/primeng/autocomplete';
import { ChipModule } from 'primeng/chip';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputSwitchModule } from 'primeng/inputswitch';
import { FirstErrorKeyPipe } from '../../../../../../shared/pipes/validation-pipe/first-error-key/first-error-key.pipe';

interface UpdateMediaForm {
  title: FormControl<string>;
  originalTitle: FormControl<string | null>;
  overview: FormControl<string>;
  originalLanguage: FormControl<string | null>;
  genres: FormControl<Genre[] | null>;
  producers: FormControl<Production[] | null>;
  studios: FormControl<Production[] | null>;
  tags: FormControl<Tag[] | null>;
  runtime: FormControl<string | null>;
  adult: FormControl<boolean>;
  releaseDate: FormGroup<ShortDateForm>;
  lastAirDate?: FormGroup<ShortDateForm>;
  visibility: FormControl<number>;
  status: FormControl<string>;
  externalIds: FormGroup<ExternalIdsForm>;
  scanner: FormGroup<MediaScannerForm>;
  updateTimestamp: FormControl<boolean>;
}

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
  imports: [FormsModule, ReactiveFormsModule, FormHandlerDirective, DisabledControlDirective, InputTextModule, InvalidControlDirective, InputTextareaModule, InputMaskModule, DropdownModule, AltAutoComplete, SharedModule, ChipModule, RadioButtonModule, InputSwitchModule, ButtonModule, FirstErrorKeyPipe]
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
  updateMediaForm: FormGroup<UpdateMediaForm>;
  updateMediaInitValue: {} = {};
  days: DropdownOptionDto[] = [];
  months: DropdownOptionDto[] = [];
  years: DropdownOptionDto[] = [];
  languages: DropdownOptionDto[] = [];
  genreSuggestions: Genre[] = [];
  productionSuggestions: Production[] = [];
  tagSuggestions: Tag[] = [];

  private tvControlsAdded: boolean = false;

  constructor(private ref: ChangeDetectorRef, private mediaService: MediaService,
    private itemDataService: ItemDataService, private genresService: GenresService, private productionsService: ProductionsService,
    private tagsService: TagsService, private destroyService: DestroyService) {
    this.updateMediaForm = new FormGroup<UpdateMediaForm>({
      title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500)] }),
      originalTitle: new FormControl('', [Validators.maxLength(500)]),
      overview: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(2000)] }),
      originalLanguage: new FormControl(''),
      genres: new FormControl(null),
      producers: new FormControl(null),
      studios: new FormControl(null),
      tags: new FormControl(null),
      runtime: new FormControl(null, [Validators.required]),
      adult: new FormControl(false, { nonNullable: true, validators: Validators.required }),
      releaseDate: new FormGroup<ShortDateForm>({
        day: new FormControl(null),
        month: new FormControl(null),
        year: new FormControl(null)
      }, { validators: shortDate('day', 'month', 'year', true), updateOn: 'change' }),
      visibility: new FormControl(1, { nonNullable: true, validators: Validators.required }),
      status: new FormControl(MediaStatus.RELEASED, { nonNullable: true, validators: Validators.required }),
      externalIds: new FormGroup<ExternalIdsForm>({
        tmdb: new FormControl(null, { validators: [Validators.min(0), Validators.maxLength(10)] }),
        imdb: new FormControl(null, { validators: Validators.maxLength(10) }),
        aniList: new FormControl(null, { validators: [Validators.min(0), Validators.maxLength(10)] }),
        mal: new FormControl(null, { validators: [Validators.min(0), Validators.maxLength(10)] })
      }, { updateOn: 'change' }),
      scanner: new FormGroup<MediaScannerForm>({
        enabled: new FormControl(false, { nonNullable: true })
      }, { updateOn: 'change' }),
      updateTimestamp: new FormControl(true, { nonNullable: true })
    }, { updateOn: 'change' });

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
    this.days = this.itemDataService.createDateList();
    this.months = this.itemDataService.createMonthList();
    this.years = this.itemDataService.createYearList();
    this.itemDataService.createLanguageList().subscribe(languages => this.languages = languages);
  }

  loadGenreSuggestions(search?: string): void {
    this.genresService.findGenreSuggestions(search).subscribe({
      next: genres => this.genreSuggestions = genres
    }).add(() => this.ref.markForCheck());
  }

  loadProductionSuggestions(search?: string): void {
    this.productionsService.findProductionSuggestions(search).subscribe({
      next: productions => this.productionSuggestions = productions
    }).add(() => this.ref.markForCheck());
  }

  loadTagSuggestions(search?: string): void {
    this.tagsService.findTagSuggestions(search).subscribe({
      next: tags => this.tagSuggestions = tags
    }).add(() => this.ref.markForCheck());
  }

  onUpdateMediaFormSubmit(): void {
    const media = this.media();
    if (!media || this.updateMediaForm.invalid) return;
    this.updateMediaForm.disable({ emitEvent: false });
    const mediaId = media._id;
    const formValue = this.updateMediaForm.getRawValue();
    const genreIds = formValue.genres?.map(g => g._id) || [];
    const producerIds = formValue.producers?.map(p => p._id) || [];
    const studioIds = formValue.studios?.map(p => p._id) || [];
    const tagIds = formValue.tags?.map(p => p._id) || [];
    const runtimeValue = timeStringToSeconds(formValue.runtime)!;
    const updateMediaDto: UpdateMediaDto = {
      title: formValue.title,
      originalTitle: formValue.originalTitle || null,
      overview: formValue.overview,
      genres: genreIds,
      originalLang: formValue.originalLanguage,
      studios: studioIds,
      producers: producerIds,
      tags: tagIds,
      runtime: runtimeValue,
      adult: formValue.adult,
      releaseDate: {
        day: formValue.releaseDate.day!,
        month: formValue.releaseDate.month!,
        year: formValue.releaseDate.year!
      },
      visibility: formValue.visibility,
      status: formValue.status,
      externalIds: formValue.externalIds,
      scanner: {
        enabled: formValue.scanner.enabled
      },
      updateTimestamp: formValue.updateTimestamp
    };
    if (media.type === MediaType.TV) {
      if (formValue.lastAirDate) {
        if (formValue.lastAirDate.day && formValue.lastAirDate.month && formValue.lastAirDate.year) {
          updateMediaDto.lastAirDate = {
            day: formValue.lastAirDate.day,
            month: formValue.lastAirDate.month,
            year: formValue.lastAirDate.year
          }
        } else {
          updateMediaDto.lastAirDate = null;
        }
      }
      if (formValue.scanner.tvSeason) {
        updateMediaDto.scanner!.tvSeason = formValue.scanner.tvSeason;
      }
    }
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
    if (media.type === MediaType.TV && !this.tvControlsAdded) {
      this.updateMediaForm.addControl('lastAirDate', new FormGroup<ShortDateForm>({
        day: new FormControl(null),
        month: new FormControl(null),
        year: new FormControl(null)
      }, { validators: shortDate('day', 'month', 'year', false), updateOn: 'change' }));
      this.updateMediaForm.controls.scanner.addControl('tvSeason', new FormControl(null));
      this.tvControlsAdded = true;
    }
    const runtimeValue = secondsToTimeString(media.runtime);
    this.updateMediaForm.patchValue({
      title: media.title,
      originalTitle: media.originalTitle || '',
      overview: media.overview,
      originalLanguage: media.originalLang || null,
      genres: media.genres,
      studios: media.studios,
      producers: media.producers,
      tags: media.tags,
      runtime: runtimeValue,
      adult: media.adult,
      releaseDate: {
        day: media.releaseDate.day,
        month: media.releaseDate.month,
        year: media.releaseDate.year
      },
      visibility: media.visibility,
      status: media.status,
      externalIds: media.externalIds,
      scanner: {
        enabled: media.scanner?.enabled || false
      }
    });
    if (media.type === MediaType.TV) {
      this.updateMediaForm.patchValue({
        lastAirDate: {
          day: media.tv.lastAirDate?.day,
          month: media.tv.lastAirDate?.month,
          year: media.tv.lastAirDate?.year
        },
        scanner: {
          tvSeason: media.scanner?.tvSeason
        }
      });
    }
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
