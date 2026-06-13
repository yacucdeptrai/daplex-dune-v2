import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { config, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { MediaComponent } from './media.component';
import { ConfirmActionService, MediaService, QueueUploadService } from '../../../../core/services';
import { WsService } from '../../../../shared/modules/ws';
import { ToastKey } from '../../../../core/enums';
import {
  mockDialogService,
  mockRouter,
  mockTranslocoService,
  provideMockActivatedRoute
} from '../../../../../testing/test-helpers';

describe('MediaComponent', () => {
  let component: MediaComponent;
  let fixture: ComponentFixture<MediaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MediaComponent],
    providers: [
        provideMockActivatedRoute(),
        { provide: Router, useValue: mockRouter() },
        { provide: DialogService, useValue: mockDialogService() },
        ConfirmationService,
        ConfirmActionService,
        { provide: MediaService, useValue: {} },
        { provide: QueueUploadService, useValue: {} },
        { provide: WsService, useValue: { fromEvent: () => of(), joinRoom: () => undefined, leaveRoom: () => undefined } },
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: MessageService, useValue: { add: () => undefined } }
    ]
})
      .overrideComponent(MediaComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(MediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

/**
 * Characterization for MediaComponent.removeMedia (media.component.ts:201) error
 * path. Today removeMedia calls mediaService.remove(id).subscribe() with NO error
 * callback, so a failed delete gives the admin no in-component feedback — the only
 * toast is the global HttpErrorInterceptor's.
 *
 * The surgeon's tail edit adds an explicit error branch that surfaces an error
 * toast via MessageService, mirroring the app-wide convention
 * (severity 'error', key ToastKey.APP — see http-error.interceptor.ts:48).
 *
 * These assert the intended NEW behavior, so they are EXPECTED-RED on unchanged
 * code (MediaComponent does not yet inject MessageService nor call add()) and
 * must go GREEN once the error branch lands. See _workspace/02_test_baseline.md.
 */
describe('MediaComponent.removeMedia error path (characterization)', () => {
  let component: MediaComponent;
  let fixture: ComponentFixture<MediaComponent>;
  let messageAdd: jasmine.Spy;
  let removeSpy: jasmine.Spy;
  let originalOnUnhandledError: ((err: unknown) => void) | null;

  // On UNCHANGED code removeMedia subscribes with no error callback, so RxJS routes
  // the failed-delete error to its global onUnhandledError sink — which otherwise
  // bubbles into afterAll and disconnects the Karma browser. Swallow it for the
  // duration of these tests; the contract under test is the error TOAST, not how
  // the error propagates. Once the surgeon adds the error branch nothing reaches
  // this sink at all.
  beforeEach(() => {
    originalOnUnhandledError = config.onUnhandledError;
    config.onUnhandledError = () => undefined;
  });

  afterEach(() => {
    config.onUnhandledError = originalOnUnhandledError;
  });

  beforeEach(async () => {
    messageAdd = jasmine.createSpy('add');
    // remove() errors so the failure branch runs. Defaults to a successful (empty)
    // observable; individual tests reprogram it.
    removeSpy = jasmine.createSpy('remove').and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [MediaComponent],
      providers: [
        provideMockActivatedRoute(),
        { provide: Router, useValue: mockRouter() },
        { provide: DialogService, useValue: mockDialogService() },
        ConfirmationService,
        ConfirmActionService,
        { provide: MediaService, useValue: { remove: removeSpy } },
        { provide: QueueUploadService, useValue: {} },
        { provide: WsService, useValue: { fromEvent: () => of(), joinRoom: () => undefined, leaveRoom: () => undefined } },
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: MessageService, useValue: { add: messageAdd } }
      ]
    })
      .overrideComponent(MediaComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(MediaComponent);
    component = fixture.componentInstance;
    // loadMedia would re-enter MediaService; stub it so removeMedia's teardown is inert.
    spyOn(component, 'loadMedia').and.stub();
    fixture.detectChanges();
  });

  it('surfaces an error toast via MessageService when the delete request fails', fakeAsync(() => {
    // Error ASYNCHRONOUSLY (delay 0) so that on UNCHANGED code — where removeMedia
    // subscribes with no error callback — RxJS routes it to the global
    // onUnhandledError sink (stubbed above) on a later tick, instead of rethrowing
    // synchronously and crashing the runner. The test then fails as a clean
    // assertion miss (add() never called). After the surgeon adds the error branch
    // the toast is raised and add() is called.
    removeSpy.and.returnValue(throwError(() => new Error('delete failed')).pipe(delay(0)));

    component.removeMedia('abc123');
    tick(0);

    expect(messageAdd).toHaveBeenCalled();
    const arg = messageAdd.calls.mostRecent()?.args[0];
    expect(arg?.severity).toBe('error');
    expect(arg?.key).toBe(ToastKey.APP);
  }));

  it('does NOT show an error toast when the delete request succeeds', fakeAsync(() => {
    removeSpy.and.returnValue(of(undefined));

    component.removeMedia('abc123');
    tick(0);

    expect(messageAdd).not.toHaveBeenCalled();
  }));
});
