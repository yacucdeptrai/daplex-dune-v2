import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { of } from 'rxjs';

import { MediaFormHelperService, UpdateMediaForm } from './media-form-helper.service';
import { CollectionService } from './collection.service';
import { GenresService } from './genres.service';
import { ProductionsService } from './productions.service';
import { TagsService } from './tags.service';
import { MediaStatus, MediaType } from '../enums';
import { ShortDateForm } from '../interfaces/forms';
import { ScannerMediaDetails } from '../models';
import { timeStringToSeconds } from '../utils';

// Covers applyScannedData: the scanner -> media-form auto-fill mapper (genre name-resolve, runtime
// seconds, ISO-date split, status map, externalIds branch). GenresService is mocked — no live calls.
// With sync `of()` sources the mapper completes synchronously, so each spec asserts right after subscribe.

function makeDetails(overrides: Partial<ScannerMediaDetails> = {}): ScannerMediaDetails {
  return {
    id: 1, title: 'Dune', originalTitle: 'Dune', overview: 'A long enough overview here',
    originalLanguage: 'en', genres: [], runtime: 9300, status: 'Released',
    releaseDate: '2021-09-15', adult: false,
    externalIds: { imdb: 'tt1160419', tmdb: 438631 },
    posterUrl: 'p', backdropUrl: 'b',
    ...overrides
  };
}

// Plain create-style form (no externalIds / scanner controls), used for the create-branch test.
function makeCreateForm() {
  return new FormGroup({
    title: new FormControl('', { nonNullable: true }),
    originalTitle: new FormControl<string | null>(''),
    overview: new FormControl('', { nonNullable: true }),
    originalLanguage: new FormControl<string | null>(''),
    genres: new FormControl<any[] | null>(null),
    runtime: new FormControl<string | null>(null),
    adult: new FormControl(false, { nonNullable: true }),
    releaseDate: new FormGroup<ShortDateForm>({
      day: new FormControl(null), month: new FormControl(null), year: new FormControl(null)
    }),
    status: new FormControl(MediaStatus.RELEASED, { nonNullable: true })
  });
}

describe('MediaFormHelperService.applyScannedData', () => {
  let helper: MediaFormHelperService;
  let genresService: any;
  let productionsService: any;
  let tagsService: any;

  beforeEach(() => {
    genresService = { findGenreSuggestions: jasmine.createSpy('findGenreSuggestions').and.returnValue(of([])) };
    productionsService = { findProductionSuggestions: jasmine.createSpy('findProductionSuggestions').and.returnValue(of([])) };
    tagsService = { findTagSuggestions: jasmine.createSpy('findTagSuggestions').and.returnValue(of([])) };
    TestBed.configureTestingModule({
      providers: [
        MediaFormHelperService,
        { provide: GenresService, useValue: genresService },
        { provide: ProductionsService, useValue: productionsService },
        { provide: TagsService, useValue: tagsService },
        { provide: CollectionService, useValue: {} }
      ]
    });
    helper = TestBed.inject(MediaFormHelperService);
  });

  // Mirrors GenresService.findGenreSuggestions(name, { withCreateOption: true }): returns the catalog
  // hits, then appends a create:name= sentinel when name <= 32 chars and has no exact case-sensitive match.
  function mockSuggestions(catalog: Record<string, { _id: string; name: string }[]>): void {
    genresService.findGenreSuggestions.and.callFake((name: string) => {
      const hits = catalog[name] ?? [];
      const out = [...hits];
      if (name && name.length <= 32 && !hits.some(g => g.name === name)) {
        out.push({ _id: `create:name=${encodeURIComponent(name)}`, name: `Create "${name}"` });
      }
      return of(out);
    });
  }

  // Mirrors ProductionsService.findProductionSuggestions: appends a sentinel when name <= 150 and unmatched.
  function mockProductionSuggestions(catalog: Record<string, { _id: string; name: string }[]>): void {
    productionsService.findProductionSuggestions.and.callFake((name: string) => {
      const hits = catalog[name] ?? [];
      const out = [...hits];
      if (name && name.length <= 150 && !hits.some(p => p.name === name)) {
        out.push({ _id: `create:name=${encodeURIComponent(name)}`, name: `Create "${name}"` });
      }
      return of(out);
    });
  }

  // Mirrors TagsService.findTagSuggestions: appends a sentinel only when name <= 32 and unmatched.
  function mockTagSuggestions(catalog: Record<string, { _id: string; name: string }[]>): void {
    tagsService.findTagSuggestions.and.callFake((name: string) => {
      const hits = catalog[name] ?? [];
      const out = [...hits];
      if (name && name.length <= 32 && !hits.some(t => t.name === name)) {
        out.push({ _id: `create:name=${encodeURIComponent(name)}`, name: `Create "${name}"` });
      }
      return of(out);
    });
  }

  it('resolves a name matching an existing genre (case-insensitive) to that existing Genre', () => {
    mockSuggestions({ action: [{ _id: 'g1', name: 'Action' }] });
    const form = helper.buildEditMediaForm();
    helper.applyScannedData(form, makeDetails({ genres: ['action'] }), MediaType.MOVIE).subscribe();
    const genres = form.controls.genres.value!;
    expect(genres.length).toBe(1);
    expect(genres[0]._id).toBe('g1');
  });

  it('resolves an unmatched <=32-char name to the create:name= sentinel (created on submit)', () => {
    mockSuggestions({ 'Sci-Fi & Fantasy': [{ _id: 'g9', name: 'Drama' }] }); // no exact match
    const form = helper.buildEditMediaForm();
    helper.applyScannedData(form, makeDetails({ genres: ['Sci-Fi & Fantasy'] }), MediaType.MOVIE).subscribe();
    const genres = form.controls.genres.value!;
    expect(genres.length).toBe(1);
    expect(genres[0]._id).toBe(`create:name=${encodeURIComponent('Sci-Fi & Fantasy')}`);
  });

  it('drops an unmatched >32-char name (no sentinel past the length guard)', () => {
    const tooLong = 'A Genre Name That Is Definitely Over Thirty-Two Characters';
    mockSuggestions({ [tooLong]: [] }); // >32 chars, so the service appends no sentinel
    const form = helper.buildEditMediaForm();
    helper.applyScannedData(form, makeDetails({ genres: [tooLong] }), MediaType.MOVIE).subscribe();
    expect(form.controls.genres.value ?? []).toEqual([]);
  });

  it('mixed list resolves existing + creates new, dropping the too-long name', () => {
    const tooLong = 'A Genre Name That Is Definitely Over Thirty-Two Characters';
    mockSuggestions({ Action: [{ _id: 'g1', name: 'Action' }], Thriller: [], [tooLong]: [] });
    const form = helper.buildEditMediaForm();
    helper.applyScannedData(form, makeDetails({ genres: ['Action', 'Thriller', tooLong] }), MediaType.MOVIE).subscribe();
    const genres = form.controls.genres.value!;
    expect(genres.length).toBe(2);
    expect(genres[0]._id).toBe('g1');
    expect(genres[1]._id).toBe(`create:name=${encodeURIComponent('Thriller')}`);
  });

  it('patches originalLanguage only when the code is in the passed list, else leaves it unchanged', () => {
    const languages = [{ value: 'en', label: 'English' }, { value: 'fr', label: 'French' }];

    const matchForm = helper.buildEditMediaForm();
    helper.applyScannedData(matchForm, makeDetails({ originalLanguage: 'fr' }), MediaType.MOVIE, languages).subscribe();
    expect(matchForm.controls.originalLanguage.value).toBe('fr');

    const missForm = helper.buildEditMediaForm();
    missForm.controls.originalLanguage.setValue('en');
    helper.applyScannedData(missForm, makeDetails({ originalLanguage: 'xx' }), MediaType.MOVIE, languages).subscribe();
    expect(missForm.controls.originalLanguage.value).withContext('unknown code leaves the control untouched').toBe('en');
  });

  it('maps runtime SECONDS via secondsToTimeString (no /60 round-trip)', () => {
    const form = helper.buildEditMediaForm();
    helper.applyScannedData(form, makeDetails({ runtime: 9300 }), MediaType.MOVIE).subscribe();
    expect(form.controls.runtime.value).toBe('02:35:00');
    expect(timeStringToSeconds(form.controls.runtime.value)).toBe(9300);
  });

  // A 0-second scan (e.g. TV episode_run_time empty) maps to '00:00:00' — visible in the runtime field
  // for the admin to catch before save. There is no dedicated 0-runtime hint (deferred to sub-slice 2).
  it('maps a 0 runtime to 00:00:00 (admin-visible in the field)', () => {
    const form = helper.buildEditMediaForm();
    helper.applyScannedData(form, makeDetails({ runtime: 0 }), MediaType.MOVIE).subscribe();
    expect(form.controls.runtime.value).toBe('00:00:00');
  });

  it('splits an ISO date into {day,month,year}', () => {
    const form = helper.buildEditMediaForm();
    helper.applyScannedData(form, makeDetails({ releaseDate: '2021-03-09' }), MediaType.MOVIE).subscribe();
    expect(form.controls.releaseDate.value).toEqual({ day: 9, month: 3, year: 2021 });
  });

  it('leaves the date control untouched on a blank/malformed string (no NaN)', () => {
    const form = helper.buildEditMediaForm();
    helper.applyScannedData(form, makeDetails({ releaseDate: '' }), MediaType.MOVIE).subscribe();
    expect(form.controls.releaseDate.value).toEqual({ day: null, month: null, year: null });
  });

  it('TV sources releaseDate from firstAirDate and patches lastAirDate when its control exists', () => {
    const form = helper.buildEditMediaForm();
    form.addControl('lastAirDate', new FormGroup<ShortDateForm>({
      day: new FormControl(null), month: new FormControl(null), year: new FormControl(null)
    }));
    const details = makeDetails({ firstAirDate: '2019-04-14', lastAirDate: '2019-05-19', status: 'Ended' });
    helper.applyScannedData(form, details, MediaType.TV).subscribe();
    expect(form.controls.releaseDate.value).toEqual({ day: 14, month: 4, year: 2019 });
    expect(form.controls.lastAirDate!.value).toEqual({ day: 19, month: 5, year: 2019 });
  });

  it('maps provider status into MediaStatus and keeps the current value on an unknown', () => {
    const movieForm = helper.buildEditMediaForm();
    helper.applyScannedData(movieForm, makeDetails({ status: 'Released' }), MediaType.MOVIE).subscribe();
    expect(movieForm.controls.status.value).toBe(MediaStatus.RELEASED);

    const tvForm = helper.buildEditMediaForm();
    helper.applyScannedData(tvForm, makeDetails({ status: 'Returning Series' }), MediaType.TV).subscribe();
    expect(tvForm.controls.status.value).toBe(MediaStatus.AIRING);

    const unknownForm = helper.buildEditMediaForm();
    unknownForm.controls.status.setValue(MediaStatus.AIRED);
    helper.applyScannedData(unknownForm, makeDetails({ status: 'Wibble' }), MediaType.MOVIE).subscribe();
    expect(unknownForm.controls.status.value).toBe(MediaStatus.AIRED);
  });

  it('patches externalIds on the edit form (imdb + tmdb, aniList/mal undefined-safe)', () => {
    const editForm = helper.buildEditMediaForm();
    helper.applyScannedData(editForm, makeDetails(), MediaType.MOVIE).subscribe();
    const externalIds = editForm.controls.externalIds.getRawValue();
    expect(externalIds.imdb).toBe('tt1160419');
    expect(externalIds.tmdb).toBe(438631);
    expect(externalIds.aniList).toBeNull();
    expect(externalIds.mal).toBeNull();
  });

  it('silently skips externalIds on a create form and still fills the text fields', () => {
    // Models the create flow (UpdateMediaForm shape, no externalIds control); cast like the real call site.
    const createForm = makeCreateForm() as unknown as FormGroup<UpdateMediaForm>;
    expect(createForm.contains('externalIds')).toBeFalse();
    helper.applyScannedData(createForm, makeDetails(), MediaType.MOVIE).subscribe();
    expect(createForm.controls.title.value).toBe('Dune');
    expect(createForm.contains('externalIds')).toBeFalse();
  });

  // Studios and producers both resolve via findProductionSuggestions (<=150-char guard), mirroring genres.
  it('resolves studios: existing Production (case-insensitive) reuses its doc, unmatched <=150 becomes a sentinel', () => {
    mockProductionSuggestions({ 'legendary pictures': [{ _id: 'p1', name: 'Legendary Pictures' }], 'Villeneuve Films': [] });
    const form = helper.buildEditMediaForm();
    helper.applyScannedData(form, makeDetails({ studios: ['legendary pictures', 'Villeneuve Films'] }), MediaType.MOVIE).subscribe();
    const studios = form.controls.studios.value!;
    expect(studios.length).toBe(2);
    expect(studios[0]._id).toBe('p1');
    expect(studios[1]._id).toBe(`create:name=${encodeURIComponent('Villeneuve Films')}`);
  });

  it('resolves producers via the same production search and patches the producers control', () => {
    mockProductionSuggestions({ 'Warner Bros': [{ _id: 'p2', name: 'Warner Bros' }] });
    const form = helper.buildEditMediaForm();
    helper.applyScannedData(form, makeDetails({ producers: ['Warner Bros'] }), MediaType.MOVIE).subscribe();
    const producers = form.controls.producers.value!;
    expect(producers.length).toBe(1);
    expect(producers[0]._id).toBe('p2');
  });

  it('resolves tags: existing reuses its doc, unmatched <=32 becomes a sentinel, >32 is dropped', () => {
    const tooLong = 'A Tag Keyword That Is Definitely Over Thirty-Two Characters';
    mockTagSuggestions({ 'space opera': [{ _id: 't1', name: 'Space Opera' }], desert: [], [tooLong]: [] });
    const form = helper.buildEditMediaForm();
    helper.applyScannedData(form, makeDetails({ tags: ['space opera', 'desert', tooLong] }), MediaType.MOVIE).subscribe();
    const tags = form.controls.tags.value!;
    expect(tags.length).toBe(2);
    expect(tags[0]._id).toBe('t1');
    expect(tags[1]._id).toBe(`create:name=${encodeURIComponent('desert')}`);
  });

  it('leaves studios/producers/tags untouched when the scan carries none (no clobber)', () => {
    const form = helper.buildEditMediaForm();
    const studio = [{ _id: 's0', name: 'Existing Studio' }] as any;
    const tag = [{ _id: 'g0', name: 'Existing Tag' }] as any;
    form.controls.studios.setValue(studio);
    form.controls.producers.setValue(studio);
    form.controls.tags.setValue(tag);
    // makeDetails leaves studios/producers/tags undefined.
    helper.applyScannedData(form, makeDetails(), MediaType.MOVIE).subscribe();
    expect(form.controls.studios.value).toBe(studio);
    expect(form.controls.producers.value).toBe(studio);
    expect(form.controls.tags.value).toBe(tag);
    expect(productionsService.findProductionSuggestions).not.toHaveBeenCalled();
    expect(tagsService.findTagSuggestions).not.toHaveBeenCalled();
  });
});
