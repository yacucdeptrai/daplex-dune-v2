import { TestBed } from '@angular/core/testing';
import { Confirmation, ConfirmationService } from 'primeng/api';

import { ConfirmActionService } from './confirm-action.service';

describe('ConfirmActionService', () => {
  let service: ConfirmActionService;
  let confirmSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConfirmActionService,
        { provide: ConfirmationService, useValue: { confirm: jasmine.createSpy('confirm') } }
      ]
    });
    service = TestBed.inject(ConfirmActionService);
    confirmSpy = TestBed.inject(ConfirmationService).confirm as jasmine.Spy;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('confirmDelete forwards the shared delete config (icon + reject focus) and accept', () => {
    const accept = jasmine.createSpy('accept');
    service.confirmDelete({ message: 'msg', header: 'hdr', accept });

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    const arg = confirmSpy.calls.mostRecent().args[0] as Confirmation;
    expect(arg.message).toBe('msg');
    expect(arg.header).toBe('hdr');
    expect(arg.icon).toBe('ms ms-delete');
    expect(arg.defaultFocus).toBe('reject');
    expect(arg.accept).toBe(accept);
  });

  it('omits key when not provided (matches keyless call sites)', () => {
    service.confirmDelete({ message: 'm', header: 'h', accept: () => {} });
    const arg = confirmSpy.calls.mostRecent().args[0] as Confirmation;
    expect('key' in arg).toBeFalse();
  });

  it('includes key only when provided (scoped dialogs)', () => {
    service.confirmDelete({ message: 'm', header: 'h', accept: () => {}, key: 'inModal' });
    const arg = confirmSpy.calls.mostRecent().args[0] as Confirmation;
    expect(arg.key).toBe('inModal');
  });
});
