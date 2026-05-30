import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { HttpErrorInterceptor } from './http-error.interceptor';
import { AuthService } from '../services';

describe('HttpErrorInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      HttpErrorInterceptor,
      { provide: MessageService, useValue: {} },
      { provide: AuthService, useValue: {} }
    ]
  }));

  it('should be created', () => {
    const interceptor: HttpErrorInterceptor = TestBed.inject(HttpErrorInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
