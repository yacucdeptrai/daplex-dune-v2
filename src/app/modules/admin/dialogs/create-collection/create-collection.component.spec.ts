import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { CreateCollectionComponent } from './create-collection.component';
import { CollectionService } from '../../../../core/services';
import { mockDynamicDialogRef } from '../../../../../testing/test-helpers';

describe('CreateCollectionComponent', () => {
  let component: CreateCollectionComponent;
  let fixture: ComponentFixture<CreateCollectionComponent>;
  let dialogRef: any;
  let collectionService: any;

  function build(collectionServiceStub: any = {}) {
    dialogRef = mockDynamicDialogRef();
    collectionService = collectionServiceStub;
    return TestBed.configureTestingModule({
      imports: [CreateCollectionComponent],
      providers: [
        { provide: DynamicDialogRef, useValue: dialogRef },
        { provide: CollectionService, useValue: collectionService }
      ]
    })
      .overrideComponent(CreateCollectionComponent, { set: { template: '' } })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(CreateCollectionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });
  }

  it('should create', async () => {
    await build();
    expect(component).toBeTruthy();
  });

  it('builds a form with name + overview controls', async () => {
    await build();
    expect(component.createCollectionForm.contains('name')).toBeTrue();
    expect(component.createCollectionForm.contains('overview')).toBeTrue();
  });

  it('onCreateCollectionFormSubmit is a no-op when the form is invalid', async () => {
    await build({ create: jasmine.createSpy('create').and.returnValue(of({})) });
    component.createCollectionForm.controls.name.setValue('');
    component.onCreateCollectionFormSubmit();
    expect(collectionService.create).not.toHaveBeenCalled();
  });

  it('onCreateCollectionFormSubmit posts name + overview and closes with true on success', async () => {
    await build({ create: jasmine.createSpy('create').and.returnValue(of({ _id: 'c1' })) });
    component.createCollectionForm.setValue({ name: 'Saga', overview: 'a sufficiently long overview' });
    component.onCreateCollectionFormSubmit();
    expect(collectionService.create).toHaveBeenCalledWith({ name: 'Saga', overview: 'a sufficiently long overview' });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });
});
