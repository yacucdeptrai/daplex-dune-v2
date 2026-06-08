import { TestBed } from '@angular/core/testing';

import { CanComponentDeactivate, ConfirmDeactivateGuard } from './confirm-deactivate.guard';

describe('ConfirmDeactivateGuard', () => {
  let guard: ConfirmDeactivateGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ConfirmDeactivateGuard] });
    guard = TestBed.inject(ConfirmDeactivateGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('delegates to the component canDeactivate when present', () => {
    const component: CanComponentDeactivate = { canDeactivate: () => false };
    expect(guard.canDeactivate(component, null as any, null as any)).toBe(false);
  });

  it('allows deactivation when the component has no canDeactivate', () => {
    expect(guard.canDeactivate({} as CanComponentDeactivate, null as any, null as any)).toBe(true);
  });
});
