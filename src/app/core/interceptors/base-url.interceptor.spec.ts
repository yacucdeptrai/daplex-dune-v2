import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';

import { BaseUrlInterceptor } from './base-url.interceptor';
import { AuthService } from '../services';
import { mockTranslocoService } from '../../../testing/test-helpers';

describe('BaseUrlInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      BaseUrlInterceptor,
      { provide: TranslocoService, useValue: mockTranslocoService() },
      { provide: AuthService, useValue: {} }
    ]
  }));

  it('should be created', () => {
    const interceptor: BaseUrlInterceptor = TestBed.inject(BaseUrlInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
