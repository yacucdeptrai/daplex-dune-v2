import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TranslocoService } from '@jsverse/transloco';

import { CollectionService } from './collection.service';
import { HTTP_TEST_PROVIDERS, mockTranslocoService } from '../../../testing/test-helpers';

describe('CollectionService', () => {
  let service: CollectionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CollectionService,
        ...HTTP_TEST_PROVIDERS,
        { provide: TranslocoService, useValue: mockTranslocoService() }
      ]
    });
    service = TestBed.inject(CollectionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('findOne issues GET collections/:id', () => {
    service.findOne('c1').subscribe();
    const req = httpMock.expectOne('collections/c1');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('findPage sends only the truthy pagination params (omits empty search)', () => {
    service.findPage({ page: 2, limit: 20, search: '', sort: 'asc(name)' }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'collections');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().sort()).toEqual(['limit', 'page', 'sort']);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.has('search')).toBe(false);
    req.flush({});
  });

  it('findPageCursor sends only the truthy cursor params', () => {
    service.findPageCursor({ pageToken: 'tok', limit: 5, search: 'foo', sort: 'desc(name)' }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'collections/cursor');
    expect(req.request.params.keys().sort()).toEqual(['limit', 'pageToken', 'search', 'sort']);
    expect(req.request.params.get('pageToken')).toBe('tok');
    req.flush({});
  });

  it('findAllMedia sends only the truthy cursor params (no type field)', () => {
    service.findAllMedia('c1', { pageToken: 'tok', limit: 12, sort: 'desc(_id)' }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'collections/c1/media');
    expect(req.request.params.keys().sort()).toEqual(['limit', 'pageToken', 'sort']);
    req.flush({});
  });

  it('uploadPoster PATCHes multipart file to collections/:id/poster and returns the collection', () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    let result: any;
    service.uploadPoster('c1', blob, 'p.png').subscribe(r => (result = r));
    const req = httpMock.expectOne('collections/c1/poster');
    expect(req.request.method).toBe('PATCH');
    const body = req.request.body as FormData;
    expect(body instanceof FormData).toBeTrue();
    expect((body.get('file') as File).name).toBe('p.png');
    req.flush({ _id: 'c1', thumbnailPosterUrl: 'tp' });
    expect(result.thumbnailPosterUrl).toBe('tp');
  });

  it('uploadPoster derives the file name from the blob when none is given', () => {
    service.uploadPoster('c1', new Blob([''], { type: 'image/png' })).subscribe();
    const req = httpMock.expectOne('collections/c1/poster');
    expect((req.request.body.get('file') as File).name).toBe('image.png');
    req.flush({});
  });

  it('deletePoster issues DELETE collections/:id/poster', () => {
    service.deletePoster('c1').subscribe();
    const req = httpMock.expectOne('collections/c1/poster');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('uploadBackdrop PATCHes multipart file to collections/:id/backdrop', () => {
    service.uploadBackdrop('c1', new Blob(['x'], { type: 'image/png' }), 'b.png').subscribe();
    const req = httpMock.expectOne('collections/c1/backdrop');
    expect(req.request.method).toBe('PATCH');
    expect((req.request.body.get('file') as File).name).toBe('b.png');
    req.flush({});
  });

  it('deleteBackdrop issues DELETE collections/:id/backdrop', () => {
    service.deleteBackdrop('c1').subscribe();
    const req = httpMock.expectOne('collections/c1/backdrop');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
