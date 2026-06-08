import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { PlaylistsService } from './playlists.service';
import { HTTP_TEST_PROVIDERS } from '../../../testing/test-helpers';

describe('PlaylistsService', () => {
  let service: PlaylistsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlaylistsService, ...HTTP_TEST_PROVIDERS]
    });
    service = TestBed.inject(PlaylistsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('findOne issues GET playlists/:id', () => {
    service.findOne('p1').subscribe();
    const req = httpMock.expectOne('playlists/p1');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
