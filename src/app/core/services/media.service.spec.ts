import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { MediaService } from './media.service';
import { HTTP_TEST_PROVIDERS, HTTP_CACHE_TEST_PROVIDERS } from '../../../testing/test-helpers';

describe('MediaService', () => {
  let service: MediaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...HTTP_TEST_PROVIDERS, ...HTTP_CACHE_TEST_PROVIDERS]
    });
    service = TestBed.inject(MediaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('findOne issues GET media/:id', () => {
    service.findOne('m1').subscribe();
    const req = httpMock.expectOne('media/m1');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
