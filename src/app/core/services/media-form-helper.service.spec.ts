import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { MediaFormHelperService } from './media-form-helper.service';
import { CollectionService } from './collection.service';
import { GenresService } from './genres.service';
import { ProductionsService } from './productions.service';
import { TagsService } from './tags.service';
import { MediaType } from '../enums';

/**
 * Covers the collections seam added to the shared form helper: the collections control on the base
 * form, the patch from media.inCollections, the editOnly-vs-create-step DTO gating, and the
 * collection-suggestion passthrough. The genres/productions/tags surface is unchanged.
 */

function makeMovieMedia(overrides: Partial<any> = {}): any {
  return {
    _id: 'm1',
    type: MediaType.MOVIE,
    title: 'Test',
    originalTitle: '',
    overview: 'an overview long enough',
    originalLang: 'en',
    genres: [],
    studios: [],
    producers: [],
    tags: [],
    runtime: 3600,
    adult: false,
    releaseDate: { day: 1, month: 1, year: 2020 },
    visibility: 1,
    status: 'released',
    externalIds: { tmdb: null, imdb: null, aniList: null, mal: null },
    scanner: { enabled: false },
    movie: { status: 0, subtitles: [] },
    ...overrides
  };
}

describe('MediaFormHelperService (collections)', () => {
  let helper: MediaFormHelperService;
  let collectionService: any;

  beforeEach(() => {
    collectionService = {
      findCollectionSuggestions: jasmine.createSpy('findCollectionSuggestions').and.returnValue(of([{ _id: 'col1', name: 'Saga' }]))
    };
    TestBed.configureTestingModule({
      providers: [
        MediaFormHelperService,
        { provide: GenresService, useValue: {} },
        { provide: ProductionsService, useValue: {} },
        { provide: TagsService, useValue: {} },
        { provide: CollectionService, useValue: collectionService }
      ]
    });
    helper = TestBed.inject(MediaFormHelperService);
  });

  it('buildEditMediaForm includes a collections control', () => {
    const form = helper.buildEditMediaForm();
    expect(form.contains('collections')).toBeTrue();
  });

  it('patchEditMediaForm fills collections from media.inCollections', () => {
    const form = helper.buildEditMediaForm();
    const inCollections = [{ _id: 'col1', name: 'Saga' }] as any;
    helper.patchEditMediaForm(form, makeMovieMedia({ inCollections }), false);
    expect(form.controls.collections.value).toEqual(inCollections);
  });

  it('patchEditMediaForm sets collections null when media has no inCollections', () => {
    const form = helper.buildEditMediaForm();
    helper.patchEditMediaForm(form, makeMovieMedia(), false);
    expect(form.controls.collections.value).toBeNull();
  });

  it('toUpdateMediaDto (editOnlyFields) maps collections to inCollections id array', () => {
    const form = helper.buildEditMediaForm();
    const media = makeMovieMedia();
    helper.patchEditMediaForm(form, media, false);
    form.controls.collections.setValue([{ _id: 'col1' } as any, { _id: 'col2' } as any]);
    form.controls.runtime.setValue('01:00:00');
    const dto = helper.toUpdateMediaDto(form.getRawValue(), media, { editOnlyFields: true });
    expect(dto.inCollections).toEqual(['col1', 'col2']);
  });

  it('toUpdateMediaDto (editOnlyFields) sends an empty inCollections array when none selected', () => {
    const form = helper.buildEditMediaForm();
    const media = makeMovieMedia();
    helper.patchEditMediaForm(form, media, false);
    form.controls.runtime.setValue('01:00:00');
    const dto = helper.toUpdateMediaDto(form.getRawValue(), media, { editOnlyFields: true });
    expect(dto.inCollections).toEqual([]);
  });

  it('toUpdateMediaDto (editOnlyFields) drops a create-on-the-fly sentinel id from inCollections', () => {
    const form = helper.buildEditMediaForm();
    const media = makeMovieMedia();
    helper.patchEditMediaForm(form, media, false);
    form.controls.collections.setValue([{ _id: 'col1' } as any, { _id: 'create:name=New%20One' } as any]);
    form.controls.runtime.setValue('01:00:00');
    const dto = helper.toUpdateMediaDto(form.getRawValue(), media, { editOnlyFields: true });
    expect(dto.inCollections).toEqual(['col1']);
  });

  it('toUpdateMediaDto WITHOUT editOnlyFields omits inCollections (create-step path does not clear it)', () => {
    const form = helper.buildEditMediaForm();
    const media = makeMovieMedia();
    helper.patchEditMediaForm(form, media, false);
    form.controls.collections.setValue([{ _id: 'col1' } as any]);
    form.controls.runtime.setValue('01:00:00');
    const dto = helper.toUpdateMediaDto(form.getRawValue(), media);
    expect('inCollections' in dto).toBeFalse();
  });

  it('findCollectionSuggestions delegates to CollectionService WITH the create option disabled (existing-only)', (done) => {
    helper.findCollectionSuggestions('sa').subscribe(result => {
      expect(collectionService.findCollectionSuggestions).toHaveBeenCalledWith('sa', { withCreateOption: false });
      expect(result).toEqual([{ _id: 'col1', name: 'Saga' }] as any);
      done();
    });
  });
});
