import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, forkJoin, map, of } from 'rxjs';

import { DropdownOptionDto, UpdateMediaDto } from '../dto/media';
import { MediaStatus, MediaType } from '../enums';
import { ExternalIdsForm, MediaScannerForm, ShortDateForm, UpdateEpisodeForm } from '../interfaces/forms';
import { Genre, MediaCollection, MediaDetails, Production, ScannerEpisode, ScannerMediaDetails, Tag } from '../models';
import { secondsToTimeString, timeStringToSeconds } from '../utils';
import { shortDate } from '../validators';
import { CollectionService } from './collection.service';
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
  collections: FormControl<MediaCollection[] | null>;
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
    private tagsService: TagsService, private collectionService: CollectionService) { }

  buildEditMediaForm(): FormGroup<EditMediaForm> {
    return new FormGroup<EditMediaForm>({
      ...this.buildBaseControls(),
      externalIds: new FormGroup<ExternalIdsForm>({
        tmdb: new FormControl(null, { validators: [Validators.min(0), Validators.maxLength(10)] }),
        imdb: new FormControl(null, { validators: Validators.maxLength(50) }),
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
      collections: media.inCollections || null,
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
      collections: media.inCollections || null,
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

  // Auto-fills text/date/genre/externalId controls from a provider scan. Genre name-resolution is
  // async (N lookups) so this returns an Observable that completes after the patch lands; callers
  // re-snapshot their dirty baseline on completion. Never routes through the patch helpers (those
  // read the local MediaDetails shape, not the scanner one). externalIds patched on the edit form only.
  // languages is the caller's option array (from its component-scoped ItemDataService); originalLanguage
  // is patched only when the scanned code matches an option, mirroring the status keep-current rule.
  applyScannedData(form: FormGroup<UpdateMediaForm> | FormGroup<EditMediaForm>, details: ScannerMediaDetails,
    type: MediaType, languages: DropdownOptionDto[] = []): Observable<void> {
    const isTv = type === MediaType.TV;
    const releaseSource = isTv ? details.firstAirDate : details.releaseDate;
    return this.resolveGenres(details.genres).pipe(map(genres => {
      form.patchValue({
        title: details.title,
        originalTitle: details.originalTitle || null,
        overview: details.overview,
        runtime: secondsToTimeString(details.runtime),
        adult: details.adult,
        status: this.mapScannerStatus(details.status, type, form.controls.status.value)
      });
      if (genres.length) form.controls.genres.setValue(genres);
      const lang = this.matchLanguageValue(details.originalLanguage, languages);
      if (lang) form.controls.originalLanguage.setValue(lang);
      this.patchShortDate(form.controls.releaseDate, releaseSource);
      if (isTv) this.patchShortDate(form.controls.lastAirDate ?? null, details.lastAirDate);
      // externalIds exists only on the edit form; look it up off the base FormGroup (the typed union's
      // per-branch get() overloads aren't mutually callable) and patch when present.
      const externalIds = (form as FormGroup).get('externalIds') as FormGroup<ExternalIdsForm> | null;
      if (externalIds) {
        externalIds.patchValue({
          imdb: details.externalIds?.imdb ?? null,
          tmdb: details.externalIds?.tmdb ?? null
        });
      }
    }));
  }

  // Synchronously auto-fills the episode form from a provider scan (no genre/language resolution, so no
  // Observable). runtime is in SECONDS and may arrive NaN/undefined — only patch it when finite, else keep
  // the safe '00:00:00' default (secondsToTimeString(NaN) wouldn't throw, but the guard pins intent and
  // never lands a null that fails Validators.required). airDate is a 'YYYY-MM-DD' STRING routed through
  // patchShortDate (NOT spread as .day/.month/.year — that shape is the local model's, not the scanner's).
  // episodeNumber is left untouched: the scan URL already targets this row, so re-patching only risks drift.
  applyScannedEpisode(form: FormGroup<UpdateEpisodeForm>, episode: ScannerEpisode): void {
    form.patchValue({
      name: episode.name,
      overview: episode.overview || '',
      runtime: Number.isFinite(episode.runtime) ? secondsToTimeString(episode.runtime) : '00:00:00'
    });
    this.patchShortDate(form.controls.airDate, episode.airDate);
  }

  // Resolves each scanned genre NAME to a local Genre via the suggestion search, keeping only an exact
  // case-insensitive .name match (no create-on-the-fly) and dropping the rest, so submit's g._id map holds.
  private resolveGenres(names: string[]): Observable<Genre[]> {
    if (!names?.length) return of([]);
    const lookups = names.map(name =>
      this.genresService.findGenreSuggestions(name, { withCreateOption: false }).pipe(
        map(matches => matches.find(g => g._id && g.name.toLowerCase() === name.toLowerCase()))
      ));
    return forkJoin(lookups).pipe(map(resolved => resolved.filter((g): g is Genre => !!g)));
  }

  // Maps a raw provider status onto MediaStatus; an unrecognised string keeps the form's current value.
  private mapScannerStatus(raw: string, type: MediaType, current: string): string {
    const value = (raw || '').toLowerCase();
    if (type === MediaType.MOVIE) {
      if (value === 'released') return MediaStatus.RELEASED;
      if (['in production', 'planned', 'post production', 'rumored', 'upcoming'].includes(value)) return MediaStatus.UPCOMING;
      return current;
    }
    if (['returning series', 'airing', 'continuing'].includes(value)) return MediaStatus.AIRING;
    if (['ended', 'canceled', 'cancelled', 'aired', 'completed'].includes(value)) return MediaStatus.AIRED;
    if (['in production', 'planned', 'upcoming', 'pilot'].includes(value)) return MediaStatus.UPCOMING;
    return current;
  }

  // Parses 'YYYY-MM-DD' into the ShortDate sub-controls; blank/malformed input is skipped (never NaN).
  private patchShortDate(group: FormGroup | null, value?: string): void {
    if (!group || !value) return;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return;
    group.patchValue({ day, month, year });
  }

  // Returns the scanned ISO code only when it matches an option value; an unknown code returns null so
  // the caller leaves the control unchanged (never lands an out-of-range value the dropdown can't show).
  private matchLanguageValue(code: string, languages: DropdownOptionDto[]): string | null {
    if (!code) return null;
    return languages.some(option => option.value === code) ? code : null;
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

  // Media form selects EXISTING collections only — no inline create (the backend inCollections path
  // is findById-only, with no find-or-create). Collections are created on the /admin/collections page.
  findCollectionSuggestions(search?: string): Observable<MediaCollection[]> {
    return this.collectionService.findCollectionSuggestions(search, { withCreateOption: false });
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
      // Drop any create-on-the-fly sentinel — collections are existing-only on the media form.
      updateMediaDto.inCollections = formValue.collections?.map(c => c._id).filter(id => !id.startsWith('create:name=')) || [];
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
      collections: new FormControl<MediaCollection[] | null>(null),
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
