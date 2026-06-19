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

  // The wire serializes studios/productions as Production objects ({name,country}) and names the producer
  // list `productions`; findOne flattens both to name-arrays and renames productions -> producers.
  it('findOne flattens studios Production[] to names and renames wire `productions` to producers names', () => {
    let result: any;
    service.findOne(7, { provider: 'tvdb', type: 'tv' }).subscribe(r => (result = r));
    httpMock.expectOne(r => r.url === 'media-scanner/7').flush({
      id: 7, title: 'Dune',
      studios: [{ name: 'Legendary Pictures', country: 'US' }, { name: 'Villeneuve Films', country: 'CA' }],
      productions: [{ name: 'Warner Bros', country: 'US' }]
    });
    expect(result.studios).toEqual(['Legendary Pictures', 'Villeneuve Films']);
    expect(result.producers).toEqual(['Warner Bros']);
    expect(result.productions).toBeUndefined();
  });

  it('findOne maps missing/empty studios + productions to [] (TMDB studios=[])', () => {
    let result: any;
    service.findOne(8, { provider: 'tmdb', type: 'movie' }).subscribe(r => (result = r));
    httpMock.expectOne(r => r.url === 'media-scanner/8').flush({ id: 8, title: 'Dune', studios: [] });
    expect(result.studios).toEqual([]);
    expect(result.producers).toEqual([]);
  });
});
