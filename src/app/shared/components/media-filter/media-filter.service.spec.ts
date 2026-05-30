import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';

import { MediaFilterService } from './media-filter.service';
import { mockTranslocoService } from '../../../../testing/test-helpers';

describe('MediaFilterService', () => {
  let service: MediaFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MediaFilterService, { provide: TranslocoService, useValue: mockTranslocoService() }]
    });
    service = TestBed.inject(MediaFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
