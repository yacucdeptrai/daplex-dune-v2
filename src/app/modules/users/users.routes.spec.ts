import { TestBed } from '@angular/core/testing';
import { ConfirmationService } from 'primeng/api';

import { USERS_ROUTES } from './users.routes';
import { ConfirmActionService } from '../../core/services';

/**
 * Route-provider DI smoke test — see admin.routes.spec.ts.
 *
 * The users feature provides the ConfirmationService + ConfirmActionService pair
 * at the route level. Resolving ConfirmActionService through the real users route
 * provider set guards against the NG0201 scope regression that blanked the user
 * pages.
 */
describe('Users route DI wiring', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [...(USERS_ROUTES[0].providers ?? [])] });
  });

  it('resolves the route-scoped ConfirmationService', () => {
    expect(TestBed.inject(ConfirmationService)).toBeTruthy();
  });

  it('resolves ConfirmActionService within the route injector (guards NG0201 scope regression)', () => {
    expect(TestBed.inject(ConfirmActionService)).toBeTruthy();
  });
});
