import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { RatingsService } from './ratings.service';
import { HTTP_TEST_PROVIDERS } from '../../../testing/test-helpers';

describe('RatingsService', () => {
  let service: RatingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RatingsService, ...HTTP_TEST_PROVIDERS]
    });
    service = TestBed.inject(RatingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
