import { TestBed } from '@angular/core/testing';

import { WsActivatorGuard } from './ws-activator.guard';
import { WsService } from '../../shared/modules/ws';
import { AuthService } from '../services';

describe('WsActivatorGuard', () => {
  let guard: WsActivatorGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WsActivatorGuard,
        { provide: WsService, useValue: {} },
        { provide: AuthService, useValue: {} }
      ]
    });
    guard = TestBed.inject(WsActivatorGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
