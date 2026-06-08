import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TranslocoService } from '@jsverse/transloco';

import { ProductionsService } from './productions.service';
import { HTTP_TEST_PROVIDERS, mockTranslocoService } from '../../../testing/test-helpers';

describe('ProductionsService', () => {
  let service: ProductionsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductionsService,
        ...HTTP_TEST_PROVIDERS,
        { provide: TranslocoService, useValue: mockTranslocoService() }
      ]
    });
    service = TestBed.inject(ProductionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('findOne issues GET productions/:id', () => {
    service.findOne('pr1').subscribe();
    const req = httpMock.expectOne('productions/pr1');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('findPage sends only the truthy pagination params (omits empty sort)', () => {
    service.findPage({ page: 1, limit: 10, search: 'q', sort: '' }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'productions');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().sort()).toEqual(['limit', 'page', 'search']);
    expect(req.request.params.has('sort')).toBe(false);
    req.flush({});
  });

  it('findPageCursor sends only the truthy cursor params', () => {
    service.findPageCursor({ pageToken: 'tok', limit: 5, search: 'foo', sort: 'asc(name)' }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'productions/cursor');
    expect(req.request.params.keys().sort()).toEqual(['limit', 'pageToken', 'search', 'sort']);
    req.flush({});
  });

  it('findAllMedia includes the type field when present', () => {
    service.findAllMedia('pr1', { pageToken: 'tok', limit: 12, sort: 'asc(name)', type: 'studio' }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'productions/pr1/media');
    expect(req.request.params.keys().sort()).toEqual(['limit', 'pageToken', 'sort', 'type']);
    expect(req.request.params.get('type')).toBe('studio');
    req.flush({});
  });

  it('findAllMedia omits the type field when absent', () => {
    service.findAllMedia('pr1', { pageToken: 'tok', limit: 12, sort: 'asc(name)' }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'productions/pr1/media');
    expect(req.request.params.keys().sort()).toEqual(['limit', 'pageToken', 'sort']);
    expect(req.request.params.has('type')).toBe(false);
    req.flush({});
  });
});
