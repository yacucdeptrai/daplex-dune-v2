import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TranslocoService } from '@ngneat/transloco';

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
});
