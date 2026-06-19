import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { of, Subject } from 'rxjs';

import { UpdateCollectionComponent } from './update-collection.component';
import { CollectionService, ConfirmActionService } from '../../../../core/services';
import { mockDialogService, mockDynamicDialogConfig, mockDynamicDialogRef, provideTranslocoTesting } from '../../../../../testing/test-helpers';

describe('UpdateCollectionComponent', () => {
  let component: UpdateCollectionComponent;
  let fixture: ComponentFixture<UpdateCollectionComponent>;
  let dialogRef: any;
  let collectionService: any;

  const ROW = { _id: 'c1', name: 'Saga', mediaCount: 3 } as any;

  function build(collectionServiceStub: any = {}) {
    dialogRef = mockDynamicDialogRef();
    collectionService = {
      findOne: jasmine.createSpy('findOne').and.returnValue(of({ _id: 'c1', name: 'Saga', overview: 'loaded overview' })),
      ...collectionServiceStub
    };
    return TestBed.configureTestingModule({
      imports: [UpdateCollectionComponent],
      providers: [
        { provide: DynamicDialogRef, useValue: dialogRef },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig(ROW) },
        { provide: CollectionService, useValue: collectionService }
      ]
    })
      .overrideComponent(UpdateCollectionComponent, { set: { template: '' } })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(UpdateCollectionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });
  }

  it('should create', async () => {
    await build();
    expect(component).toBeTruthy();
  });

  it('pre-fills name from the row and the overview from the fetched detail', async () => {
    await build();
    expect(collectionService.findOne).toHaveBeenCalledWith('c1');
    expect(component.updateCollectionForm.controls.name.value).toBe('Saga');
    expect(component.updateCollectionForm.controls.overview.value).toBe('loaded overview');
  });

  it('disables the form until findOne resolves, then re-enables it (no submit before overview is hydrated)', async () => {
    const detail$ = new Subject<any>();
    await build({ findOne: jasmine.createSpy('findOne').and.returnValue(detail$) });
    // Before findOne emits: form is disabled so an early Submit cannot fire an invalid (empty-overview) update.
    expect(component.updateCollectionForm.disabled).toBeTrue();
    detail$.next({ _id: 'c1', name: 'Saga', overview: 'loaded overview' });
    detail$.complete();
    expect(component.updateCollectionForm.disabled).toBeFalse();
    expect(component.updateCollectionForm.controls.overview.value).toBe('loaded overview');
  });

  it('onUpdateCollectionFormSubmit patches name + overview and closes with true on success', async () => {
    await build({ update: jasmine.createSpy('update').and.returnValue(of({ _id: 'c1' })) });
    component.updateCollectionForm.setValue({ name: 'Renamed', overview: 'a sufficiently long overview' });
    component.onUpdateCollectionFormSubmit();
    expect(collectionService.update).toHaveBeenCalledWith('c1', { name: 'Renamed', overview: 'a sufficiently long overview' });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('seeds the image-section collection from the row _id BEFORE findOne resolves (live while form is disabled)', async () => {
    const detail$ = new Subject<any>();
    await build({ findOne: jasmine.createSpy('findOne').and.returnValue(detail$) });
    // The image section binds `collection` and needs only `_id` — available immediately, even
    // though the overview-gated form is still disabled.
    expect(component.updateCollectionForm.disabled).toBeTrue();
    expect(component.collection._id).toBe('c1');
    detail$.complete();
  });

  it('hydrates the image-section preview from the fetched detail', async () => {
    collectionService = { findOne: jasmine.createSpy('findOne').and.returnValue(of({ _id: 'c1', name: 'Saga', overview: 'ov', thumbnailPosterUrl: 'tp' })) };
    await build(collectionService);
    expect(component.collection.thumbnailPosterUrl).toBe('tp');
  });

  it('onCollectionChange replaces the collection used by the preview', async () => {
    await build();
    component.onCollectionChange({ _id: 'c1', name: 'Saga', overview: 'ov', media: [], mediaCount: 1, thumbnailPosterUrl: 'next' } as any);
    expect(component.collection.thumbnailPosterUrl).toBe('next');
  });
});

// Renders the REAL template (no override) to prove the in-modal delete-confirm seam: the image
// section's confirmDelete({key:'inModal'}) only fires the DELETE if this host exists and shares
// the route-scoped ConfirmationService. Mirrors how configure-media hosts its confirmDialog.
describe('UpdateCollectionComponent (in-modal confirm host)', () => {
  let fixture: ComponentFixture<UpdateCollectionComponent>;
  let component: UpdateCollectionComponent;
  let confirmationService: ConfirmationService;
  let collectionService: any;

  const ROW = { _id: 'c1', name: 'Saga', mediaCount: 3 } as any;

  async function render() {
    collectionService = {
      findOne: jasmine.createSpy('findOne').and.returnValue(of({ _id: 'c1', name: 'Saga', overview: 'ov' })),
      deletePoster: jasmine.createSpy('deletePoster').and.returnValue(of(undefined)),
      deleteBackdrop: jasmine.createSpy('deleteBackdrop').and.returnValue(of(undefined))
    };
    await TestBed.configureTestingModule({
      imports: [UpdateCollectionComponent],
      providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig(ROW) },
        { provide: CollectionService, useValue: collectionService },
        { provide: DialogService, useValue: mockDialogService() },
        // Route-scoped tokens supplied by the surrounding (admin route) injector, as in prod.
        ConfirmationService,
        ConfirmActionService,
        ...provideTranslocoTesting()
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(UpdateCollectionComponent);
    component = fixture.componentInstance;
    confirmationService = TestBed.inject(ConfirmationService);
    fixture.detectChanges();
  }

  it('hosts a <p-confirmDialog key="inModal"> in the rendered dialog', async () => {
    await render();
    const host = fixture.nativeElement.querySelector('p-confirmdialog, p-confirmDialog');
    expect(host).toBeTruthy();
    expect(host.getAttribute('key')).toBe('inModal');
  });

  it('image-section deletePoster routes through the route-scoped ConfirmationService (key:inModal) and DELETEs on accept', async () => {
    await render();
    const confirmSpy = spyOn(confirmationService, 'confirm').and.callThrough();
    const images = fixture.debugElement.children
      .map(d => d.componentInstance).find(c => c && 'deletePoster' in c);
    expect(images).toBeTruthy();
    images.deletePoster({ target: document.createElement('button') } as unknown as Event);
    const arg = confirmSpy.calls.mostRecent().args[0];
    expect(arg.key).toBe('inModal');
    arg.accept!();
    expect(collectionService.deletePoster).toHaveBeenCalledWith('c1');
  });

  it('image-section deleteBackdrop routes through ConfirmationService and DELETEs on accept', async () => {
    await render();
    const confirmSpy = spyOn(confirmationService, 'confirm').and.callThrough();
    const images = fixture.debugElement.children
      .map(d => d.componentInstance).find(c => c && 'deleteBackdrop' in c);
    images.deleteBackdrop({ target: document.createElement('button') } as unknown as Event);
    const arg = confirmSpy.calls.mostRecent().args[0];
    expect(arg.key).toBe('inModal');
    arg.accept!();
    expect(collectionService.deleteBackdrop).toHaveBeenCalledWith('c1');
  });
});
