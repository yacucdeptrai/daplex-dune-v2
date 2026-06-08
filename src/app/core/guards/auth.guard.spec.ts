import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

import { AuthGuard } from './auth.guard';
import { AuthService } from '../services';
import { mockRouter } from '../../../testing/test-helpers';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: ReturnType<typeof mockRouter>;
  let authService: { currentUser: unknown };

  beforeEach(() => {
    router = mockRouter();
    authService = { currentUser: null };
    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: authService }
      ]
    });
    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('redirects to /sign-in and denies access when no user is logged in', () => {
    const route = { data: {} } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/admin' } as RouterStateSnapshot;
    const result = guard.canActivate(route, state);
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/sign-in'], { queryParams: { continue: '/admin' } });
  });

  it('grants access to the owner regardless of required permissions', () => {
    authService.currentUser = { owner: true };
    const route = { data: { withPermissions: [1, 2] } } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/admin' } as RouterStateSnapshot;
    expect(guard.canActivate(route, state)).toBe(true);
  });
});
