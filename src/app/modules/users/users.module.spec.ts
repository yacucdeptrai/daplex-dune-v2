import { TestBed } from '@angular/core/testing';
import { ConfirmationService } from 'primeng/api';

import { UsersModule } from './users.module';
import { ConfirmActionService } from '../../core/services';

/**
 * Real-module DI smoke test — see admin.module.spec.ts.
 *
 * UsersModule also provides the module-scoped ConfirmationService +
 * ConfirmActionService pair. Resolving ConfirmActionService through the real
 * UsersModule injector guards against the NG0201 scope regression that blanked
 * the user pages.
 */
describe('UsersModule DI wiring', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [UsersModule] });
  });

  it('resolves the module-scoped ConfirmationService', () => {
    expect(TestBed.inject(ConfirmationService)).toBeTruthy();
  });

  it('resolves ConfirmActionService within the module injector (guards NG0201 scope regression)', () => {
    expect(TestBed.inject(ConfirmActionService)).toBeTruthy();
  });
});
