import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { VideoPlayerService } from './video-player.service';
import { HTTP_TEST_PROVIDERS } from '../../../../testing/test-helpers';

describe('VideoPlayerService', () => {
  let service: VideoPlayerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VideoPlayerService, ...HTTP_TEST_PROVIDERS]
    });
    service = TestBed.inject(VideoPlayerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
