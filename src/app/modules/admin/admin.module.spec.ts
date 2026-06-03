import { TestBed } from '@angular/core/testing';
import { ConfirmationService } from 'primeng/api';

import { AdminModule } from './admin.module';
import { ConfirmActionService } from '../../core/services';

/**
 * Real-module DI smoke test.
 *
 * The hand-rolled component specs mock their providers, so they cannot catch a
 * provider-scope regression like the NG0201 incident where ConfirmActionService
 * was `providedIn: 'root'` while depending on the module-scoped ConfirmationService.
 *
 * Resolving ConfirmActionService through the *real* AdminModule injector exercises
 * that wiring: if it is ever made root-provided again (and thus cannot see the
 * module-scoped ConfirmationService), this resolution throws NG0201 and fails CI.
 */
describe('AdminModule DI wiring', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AdminModule] });
  });

  it('resolves the module-scoped ConfirmationService', () => {
    expect(TestBed.inject(ConfirmationService)).toBeTruthy();
  });

  it('resolves ConfirmActionService within the module injector (guards NG0201 scope regression)', () => {
    expect(TestBed.inject(ConfirmActionService)).toBeTruthy();
  });
});
