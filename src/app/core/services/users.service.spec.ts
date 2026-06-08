import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { UsersService } from './users.service';
import { HTTP_TEST_PROVIDERS } from '../../../testing/test-helpers';

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsersService, ...HTTP_TEST_PROVIDERS]
    });
    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('findOne issues GET users/:id', () => {
    service.findOne('abc').subscribe();
    const req = httpMock.expectOne('users/abc');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
