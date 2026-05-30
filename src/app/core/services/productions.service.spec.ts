import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TranslocoService } from '@ngneat/transloco';

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
});
