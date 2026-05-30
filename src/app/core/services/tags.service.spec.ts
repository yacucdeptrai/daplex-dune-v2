import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TranslocoService } from '@ngneat/transloco';

import { TagsService } from './tags.service';
import { HTTP_TEST_PROVIDERS, mockTranslocoService } from '../../../testing/test-helpers';

describe('TagsService', () => {
  let service: TagsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TagsService,
        ...HTTP_TEST_PROVIDERS,
        { provide: TranslocoService, useValue: mockTranslocoService() }
      ]
    });
    service = TestBed.inject(TagsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('findOne issues GET tags/:id', () => {
    service.findOne('t1').subscribe();
    const req = httpMock.expectOne('tags/t1');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
