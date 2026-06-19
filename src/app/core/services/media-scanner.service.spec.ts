import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { MediaScannerService } from './media-scanner.service';
import { HTTP_TEST_PROVIDERS } from '../../../testing/test-helpers';

describe('MediaScannerService', () => {
  let service: MediaScannerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [...HTTP_TEST_PROVIDERS] });
    service = TestBed.inject(MediaScannerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('search GETs media-scanner with exact string params', () => {
    service.search({ provider: 'tmdb', type: 'movie', query: 'dune', page: 1, year: 2021, language: 'en-US' }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'media-scanner');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().sort()).toEqual(['language', 'page', 'provider', 'query', 'type', 'year']);
    expect(req.request.params.get('provider')).toBe('tmdb');
    expect(req.request.params.get('type')).toBe('movie');
    expect(req.request.params.get('query')).toBe('dune');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('year')).toBe('2021');
    expect(req.request.params.get('language')).toBe('en-US');
    req.flush({ page: 1, totalPages: 1, totalResults: 0, results: [] });
  });

  it('search omits includeAdult:false (toTruthyHttpParams drops falsy)', () => {
    service.search({ provider: 'tmdb', type: 'movie', query: 'dune', includeAdult: false }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'media-scanner');
    expect(req.request.params.has('includeAdult')).toBeFalse();
    req.flush({ page: 1, totalPages: 1, totalResults: 0, results: [] });
  });

  it('search sends includeAdult only when true', () => {
    service.search({ provider: 'tmdb', type: 'movie', query: 'dune', includeAdult: true }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'media-scanner');
    expect(req.request.params.get('includeAdult')).toBe('true');
    req.flush({ page: 1, totalPages: 1, totalResults: 0, results: [] });
  });

  it('findOne GETs media-scanner/:id with provider + type', () => {
    service.findOne(42, { provider: 'tvdb', type: 'tv' }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'media-scanner/42');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('provider')).toBe('tvdb');
    expect(req.request.params.get('type')).toBe('tv');
    req.flush({ id: 42, title: 'Show' });
  });
});
