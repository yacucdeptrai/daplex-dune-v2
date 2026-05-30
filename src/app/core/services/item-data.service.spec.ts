import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';

import { ItemDataService } from './item-data.service';
import { mockTranslocoService } from '../../../testing/test-helpers';

describe('ItemDataService', () => {
  let service: ItemDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ItemDataService, { provide: TranslocoService, useValue: mockTranslocoService() }]
    });
    service = TestBed.inject(ItemDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('createDateList returns the requested number of days', () => {
    expect(service.createDateList(31).length).toBe(31);
  });
});
