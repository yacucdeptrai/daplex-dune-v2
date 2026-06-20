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

  it('uploadPosterFromUrl PATCHes a JSON { url } body (not FormData) and busts the home cache', () => {
    const invalidate = spyOn(service, 'invalidateHomeMediaCache');
    service.uploadPosterFromUrl('m1', 'https://image.tmdb.org/p.jpg').subscribe();
    const req = httpMock.expectOne('media/m1/poster');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body instanceof FormData).toBeFalse();
    expect(req.request.body).toEqual({ url: 'https://image.tmdb.org/p.jpg' });
    req.flush({ posterUrl: 'new' });
    expect(invalidate).toHaveBeenCalled();
  });

  it('uploadBackdropFromUrl PATCHes a JSON { url } body (not FormData) and busts the home cache', () => {
    const invalidate = spyOn(service, 'invalidateHomeMediaCache');
    service.uploadBackdropFromUrl('m1', 'https://artworks.thetvdb.com/b.jpg').subscribe();
    const req = httpMock.expectOne('media/m1/backdrop');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body instanceof FormData).toBeFalse();
    expect(req.request.body).toEqual({ url: 'https://artworks.thetvdb.com/b.jpg' });
    req.flush({ backdropUrl: 'new' });
    expect(invalidate).toHaveBeenCalled();
  });

  it('importVideoFromScan reconstructs the watch URL and POSTs { name, url, official }', () => {
    service.importVideoFromScan('m1', { key: 'abc11abc11a', name: 'Official Trailer', official: true }).subscribe();
    const req = httpMock.expectOne('media/m1/videos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Official Trailer',
      url: 'https://www.youtube.com/watch?v=abc11abc11a',
      official: true
    });
    req.flush([]);
  });
});
