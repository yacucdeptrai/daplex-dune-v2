import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { DropdownOptionDto, UpdateMediaDto } from '../dto/media';
import { MediaStatus, MediaType } from '../enums';
import { ExternalIdsForm, MediaScannerForm, ShortDateForm } from '../interfaces/forms';
import { Genre, MediaDetails, Production, Tag } from '../models';
import { secondsToTimeString, timeStringToSeconds } from '../utils';
import { shortDate } from '../validators';
import { GenresService } from './genres.service';
import { ItemDataService } from './item-data.service';
import { ProductionsService } from './productions.service';
import { TagsService } from './tags.service';

export interface UpdateMediaForm {
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
}

// Edit form adds the scanner/external-id controls the in-place edit tab needs; the create flow's
// update step uses the plain UpdateMediaForm without them.
export interface EditMediaForm extends UpdateMediaForm {
  externalIds: FormGroup<ExternalIdsForm>;
  scanner: FormGroup<MediaScannerForm>;
  updateTimestamp: FormControl<boolean>;
}

export type UpdateMediaFormValue = ReturnType<FormGroup<UpdateMediaForm>['getRawValue']>;
export type EditMediaFormValue = ReturnType<FormGroup<EditMediaForm>['getRawValue']>;

// Stateless shared form logic for the create-media and configure-media edit flows. Holds no
// per-instance form state: callers own their FormGroup, init snapshots and suggestion arrays.
// Injects only root services; ItemDataService is component-scoped so its methods take it as an arg.
@Injectable({ providedIn: 'root' })
export class MediaFormHelperService {
  constructor(private genresService: GenresService, private productionsService: ProductionsService,
    private tagsService: TagsService) { }

  buildEditMediaForm(): FormGroup<EditMediaForm> {
    return new FormGroup<EditMediaForm>({
      ...this.buildBaseControls(),
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
    } as EditMediaForm, { updateOn: 'change' });
  }

  // Patches the shared fields from a media record. TV last-air-date is patched only when its control
  // exists; scanner/externalIds belong to the edit form and are patched by patchEditFields.
  patchUpdateMediaForm(form: FormGroup<UpdateMediaForm>, media: MediaDetails): void {
    form.patchValue({
      title: media.title,
      originalTitle: media.originalTitle || '',
      overview: media.overview,
      originalLanguage: media.originalLang || null,
      genres: media.genres,
      studios: media.studios,
      producers: media.producers,
      tags: media.tags,
      runtime: secondsToTimeString(media.runtime),
      adult: media.adult,
      releaseDate: {
        day: media.releaseDate.day,
        month: media.releaseDate.month,
        year: media.releaseDate.year
      },
      visibility: media.visibility,
      status: media.status
    });
    if (media.type === MediaType.TV && form.controls.lastAirDate) {
      form.patchValue({
        lastAirDate: {
          day: media.tv.lastAirDate?.day,
          month: media.tv.lastAirDate?.month,
          year: media.tv.lastAirDate?.year
        }
      });
    }
  }

  // Edit-form patch: lazily adds the edit-only TV controls on first TV patch, fills the shared fields
  // plus the scanner/external-id fields, then the TV fields. Returns whether the TV controls now exist
  // so the caller can persist its tvControlsAdded guard. Mirrors the edit tab's pre-extraction patch.
  patchEditMediaForm(form: FormGroup<EditMediaForm>, media: MediaDetails, tvControlsAdded: boolean): boolean {
    if (media.type === MediaType.TV && !tvControlsAdded) {
      form.addControl('lastAirDate', new FormGroup<ShortDateForm>({
        day: new FormControl(null),
        month: new FormControl(null),
        year: new FormControl(null)
      }, { validators: shortDate('day', 'month', 'year', false), updateOn: 'change' }));
      form.controls.scanner.addControl('tvSeason', new FormControl(null));
      tvControlsAdded = true;
    }
    const runtimeValue = secondsToTimeString(media.runtime);
    form.patchValue({
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
      form.patchValue({
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
    return tvControlsAdded;
  }

  findGenreSuggestions(search?: string): Observable<Genre[]> {
    return this.genresService.findGenreSuggestions(search);
  }

  findProductionSuggestions(search?: string): Observable<Production[]> {
    return this.productionsService.findProductionSuggestions(search);
  }

  findTagSuggestions(search?: string): Observable<Tag[]> {
    return this.tagsService.findTagSuggestions(search);
  }

  // ItemDataService is component-scoped, so callers pass their instance rather than the root service
  // injecting it (that would be the NG0201 root-injector trap).
  buildDateLists(itemData: ItemDataService): { days: DropdownOptionDto[]; months: DropdownOptionDto[]; years: DropdownOptionDto[] } {
    return {
      days: itemData.createDateList(),
      months: itemData.createMonthList(),
      years: itemData.createYearList()
    };
  }

  createLanguageList(itemData: ItemDataService): Observable<DropdownOptionDto[]> {
    return itemData.createLanguageList();
  }

  // editOnlyFields adds tags/externalIds/scanner/updateTimestamp + the lazy-vs-eager TV branches the
  // in-place edit tab needs; the create flow's update step omits them (and tags) to keep its DTO shape.
  // formValue takes the base raw value with the edit-only fields optional, so both forms can call it.
  toUpdateMediaDto(formValue: UpdateMediaFormValue & Partial<EditMediaFormValue>, media: MediaDetails,
    opts?: { editOnlyFields?: boolean }): UpdateMediaDto {
    const updateMediaDto: UpdateMediaDto = {
      title: formValue.title,
      originalTitle: formValue.originalTitle || null,
      overview: formValue.overview,
      genres: formValue.genres?.map(g => g._id) || [],
      originalLang: formValue.originalLanguage,
      studios: formValue.studios?.map(p => p._id) || [],
      producers: formValue.producers?.map(p => p._id) || [],
      runtime: timeStringToSeconds(formValue.runtime)!,
      adult: formValue.adult,
      releaseDate: {
        day: formValue.releaseDate.day!,
        month: formValue.releaseDate.month!,
        year: formValue.releaseDate.year!
      },
      visibility: formValue.visibility,
      status: formValue.status
    };
    if (opts?.editOnlyFields) {
      const scanner = formValue.scanner!;
      updateMediaDto.tags = formValue.tags?.map(p => p._id) || [];
      updateMediaDto.externalIds = formValue.externalIds!;
      updateMediaDto.scanner = {
        enabled: scanner.enabled
      };
      updateMediaDto.updateTimestamp = formValue.updateTimestamp!;
      if (media.type === MediaType.TV) {
        if (formValue.lastAirDate) {
          if (formValue.lastAirDate.day && formValue.lastAirDate.month && formValue.lastAirDate.year) {
            updateMediaDto.lastAirDate = {
              day: formValue.lastAirDate.day,
              month: formValue.lastAirDate.month,
              year: formValue.lastAirDate.year
            };
          } else {
            updateMediaDto.lastAirDate = null;
          }
        }
        if (scanner.tvSeason) {
          updateMediaDto.scanner!.tvSeason = scanner.tvSeason;
        }
      }
    } else if (media.type === MediaType.TV && formValue.lastAirDate) {
      updateMediaDto.lastAirDate = {
        day: formValue.lastAirDate.day!,
        month: formValue.lastAirDate.month!,
        year: formValue.lastAirDate.year!
      };
    }
    return updateMediaDto;
  }

  private buildBaseControls() {
    return {
      title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500)] }),
      originalTitle: new FormControl<string | null>('', [Validators.maxLength(500)]),
      overview: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(2000)] }),
      originalLanguage: new FormControl<string | null>(''),
      genres: new FormControl<Genre[] | null>(null),
      producers: new FormControl<Production[] | null>(null),
      studios: new FormControl<Production[] | null>(null),
      tags: new FormControl<Tag[] | null>(null),
      runtime: new FormControl<string | null>(null, [Validators.required]),
      adult: new FormControl(false, { nonNullable: true, validators: Validators.required }),
      releaseDate: new FormGroup<ShortDateForm>({
        day: new FormControl(null),
        month: new FormControl(null),
        year: new FormControl(null)
      }, { validators: shortDate('day', 'month', 'year', true), updateOn: 'change' }),
      visibility: new FormControl(1, { nonNullable: true, validators: Validators.required }),
      status: new FormControl(MediaStatus.RELEASED, { nonNullable: true, validators: Validators.required })
    };
  }
}
