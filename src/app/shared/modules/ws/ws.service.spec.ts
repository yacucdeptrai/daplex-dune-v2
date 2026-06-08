import { TestBed } from '@angular/core/testing';

import { WsService } from './ws.service';
import { AuthService } from '../../../core/services/auth.service';

describe('WsService', () => {
  let service: WsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WsService, { provide: AuthService, useValue: {} }]
    });
    service = TestBed.inject(WsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
