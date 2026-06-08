import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TranslocoService } from '@jsverse/transloco';

import { GenresService } from './genres.service';
import {
  HTTP_TEST_PROVIDERS,
  HTTP_CACHE_TEST_PROVIDERS,
  mockTranslocoService
} from '../../../testing/test-helpers';

describe('GenresService', () => {
  let service: GenresService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...HTTP_TEST_PROVIDERS,
        ...HTTP_CACHE_TEST_PROVIDERS,
        { provide: TranslocoService, useValue: mockTranslocoService() }
      ]
    });
    service = TestBed.inject(GenresService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('findOne issues GET genres/:id', () => {
    service.findOne('g1').subscribe();
    const req = httpMock.expectOne('genres/g1');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('findPage sends only the truthy pagination params (omits empty search)', () => {
    service.findPage({ page: 1, limit: 10, search: '', sort: 'asc(name)' }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'genres');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().sort()).toEqual(['limit', 'page', 'sort']);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('sort')).toBe('asc(name)');
    expect(req.request.params.has('search')).toBe(false);
    req.flush({});
  });

  it('findPage omits page when it is 0 (numeric-falsy edge case)', () => {
    service.findPage({ page: 0, limit: 10, sort: 'asc(name)' }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'genres');
    expect(req.request.params.has('page')).toBe(false);
    expect(req.request.params.keys().sort()).toEqual(['limit', 'sort']);
    req.flush({});
  });

  it('findPageCursor sends only the truthy cursor params (omits empty sort)', () => {
    service.findPageCursor({ pageToken: 'tok', limit: 5, search: 'foo', sort: '' }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'genres/cursor');
    expect(req.request.params.keys().sort()).toEqual(['limit', 'pageToken', 'search']);
    expect(req.request.params.get('pageToken')).toBe('tok');
    expect(req.request.params.get('search')).toBe('foo');
    expect(req.request.params.has('sort')).toBe(false);
    req.flush({});
  });

  it('findAll sends ids (multi-value) and sort when present', () => {
    service.findAll({ ids: ['a', 'b'], sort: 'asc(name)' }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'genres/all');
    expect(req.request.params.getAll('ids')).toEqual(['a', 'b']);
    expect(req.request.params.get('sort')).toBe('asc(name)');
    req.flush([]);
  });

  it('findAll omits ids when not provided', () => {
    service.findAll({ sort: 'asc(name)' }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'genres/all');
    expect(req.request.params.keys()).toEqual(['sort']);
    expect(req.request.params.has('ids')).toBe(false);
    req.flush([]);
  });

  it('findAllMedia sends only the truthy cursor params', () => {
    service.findAllMedia('g1', { pageToken: 'tok', limit: 12, sort: 'desc(_id)' }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'genres/g1/media');
    expect(req.request.params.keys().sort()).toEqual(['limit', 'pageToken', 'sort']);
    req.flush({});
  });
});
