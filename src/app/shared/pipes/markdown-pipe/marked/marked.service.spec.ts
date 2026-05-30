import { TestBed } from '@angular/core/testing';

import { MarkedService } from './marked.service';
import { DompurifyService } from '../../html-pipe';

describe('MarkedService', () => {
  let service: MarkedService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MarkedService, DompurifyService] });
    service = TestBed.inject(MarkedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
