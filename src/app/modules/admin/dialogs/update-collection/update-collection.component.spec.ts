import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of, Subject } from 'rxjs';

import { UpdateCollectionComponent } from './update-collection.component';
import { CollectionService } from '../../../../core/services';
import { mockDynamicDialogConfig, mockDynamicDialogRef } from '../../../../../testing/test-helpers';

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
});
