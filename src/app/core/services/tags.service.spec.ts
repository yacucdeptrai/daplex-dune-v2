import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TranslocoService } from '@jsverse/transloco';

import { TagsService } from './tags.service';
import { HTTP_TEST_PROVIDERS, mockTranslocoService } from '../../../testing/test-helpers';

describe('TagsService', () => {
  let service: TagsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TagsService,
        ...HTTP_TEST_PROVIDERS,
        { provide: TranslocoService, useValue: mockTranslocoService() }
      ]
    });
    service = TestBed.inject(TagsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('findOne issues GET tags/:id', () => {
    service.findOne('t1').subscribe();
    const req = httpMock.expectOne('tags/t1');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('findPage sends only the truthy pagination params', () => {
    service.findPage({ page: 1, limit: 10, search: 'q', sort: 'asc(name)' }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'tags');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().sort()).toEqual(['limit', 'page', 'search', 'sort']);
    req.flush({});
  });

  it('findPageCursor sends only the truthy cursor params (omits empty search)', () => {
    service.findPageCursor({ pageToken: 'tok', limit: 5, search: '', sort: 'asc(name)' }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'tags/cursor');
    expect(req.request.params.keys().sort()).toEqual(['limit', 'pageToken', 'sort']);
    expect(req.request.params.has('search')).toBe(false);
    req.flush({});
  });

  it('findAllMedia sends only the truthy cursor params', () => {
    service.findAllMedia('t1', { pageToken: 'tok', limit: 12, sort: 'desc(_id)' }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'tags/t1/media');
    expect(req.request.params.keys().sort()).toEqual(['limit', 'pageToken', 'sort']);
    req.flush({});
  });
});
