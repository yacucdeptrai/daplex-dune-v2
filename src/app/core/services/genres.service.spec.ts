import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TranslocoService } from '@ngneat/transloco';

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
});
