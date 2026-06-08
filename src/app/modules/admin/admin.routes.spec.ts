import { TestBed } from '@angular/core/testing';
import { ConfirmationService } from 'primeng/api';

import { ADMIN_ROUTES } from './admin.routes';
import { ConfirmActionService } from '../../core/services';

/**
 * Route-provider DI smoke test (standalone era).
 *
 * After the standalone migration the admin feature provides ConfirmationService
 * and ConfirmActionService at the route level instead of via AdminModule. The
 * hand-rolled component specs mock their providers, so they cannot catch a
 * provider-scope regression like the NG0201 incident where ConfirmActionService
 * was providedIn 'root' while depending on the module/route-scoped
 * ConfirmationService.
 *
 * Resolving ConfirmActionService through the real admin route provider set
 * exercises that wiring: if it is ever made root-provided again (and thus cannot
 * see the route-scoped ConfirmationService), this resolution throws NG0201.
 */
describe('Admin route DI wiring', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [...(ADMIN_ROUTES[0].providers ?? [])] });
  });

  it('resolves the route-scoped ConfirmationService', () => {
    expect(TestBed.inject(ConfirmationService)).toBeTruthy();
  });

  it('resolves ConfirmActionService within the route injector (guards NG0201 scope regression)', () => {
    expect(TestBed.inject(ConfirmActionService)).toBeTruthy();
  });
});
