import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { QueueUploadService } from './queue-upload.service';
import { HTTP_TEST_PROVIDERS } from '../../../testing/test-helpers';

describe('QueueUploadService', () => {
  let service: QueueUploadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [QueueUploadService, ...HTTP_TEST_PROVIDERS]
    });
    service = TestBed.inject(QueueUploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
