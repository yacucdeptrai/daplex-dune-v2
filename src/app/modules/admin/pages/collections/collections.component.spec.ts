import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { CollectionsComponent } from './collections.component';
import { CollectionService, ConfirmActionService } from '../../../../core/services';
import { CreateCollectionComponent } from '../../dialogs/create-collection';
import { UpdateCollectionComponent } from '../../dialogs/update-collection';
import { mockDialogService, mockTranslocoService } from '../../../../../testing/test-helpers';

describe('CollectionsComponent', () => {
  let component: CollectionsComponent;
  let fixture: ComponentFixture<CollectionsComponent>;
  let dialogService: any;
  let collectionService: any;

  function build(collectionServiceStub: any = {}) {
    dialogService = mockDialogService();
    collectionService = collectionServiceStub;
    return TestBed.configureTestingModule({
      imports: [CollectionsComponent],
      providers: [
        { provide: DialogService, useValue: dialogService },
        ConfirmationService,
        ConfirmActionService,
        { provide: CollectionService, useValue: collectionService },
        { provide: TranslocoService, useValue: mockTranslocoService() }
      ]
    })
      .overrideComponent(CollectionsComponent, { set: { template: '' } })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(CollectionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });
  }

  it('should create', async () => {
    await build();
    expect(component).toBeTruthy();
  });

  it('loadCollections fetches a page and stores it, clearing the loading flag', async () => {
    const page = { results: [{ _id: 'c1', name: 'Saga', mediaCount: 3 }], totalResults: 1 } as any;
    await build({ findPage: jasmine.createSpy('findPage').and.returnValue(of(page)) });
    component.loadCollections();
    expect(collectionService.findPage).toHaveBeenCalledTimes(1);
    expect(component.collectionList).toBe(page);
    expect(component.loadingCollectionList).toBeFalse();
  });

  it('showCreateCollectionDialog opens CreateCollectionComponent', async () => {
    await build();
    component.showCreateCollectionDialog();
    expect(dialogService.open).toHaveBeenCalledTimes(1);
    expect(dialogService.open.calls.mostRecent().args[0]).toBe(CreateCollectionComponent);
  });

  it('showUpdateCollectionDialog opens UpdateCollectionComponent with the row as dialog data', async () => {
    await build();
    const row = { _id: 'c1', name: 'Saga', mediaCount: 3 } as any;
    component.showUpdateCollectionDialog(row);
    expect(dialogService.open).toHaveBeenCalledTimes(1);
    const [openedComponent, cfg] = dialogService.open.calls.mostRecent().args;
    expect(openedComponent).toBe(UpdateCollectionComponent);
    expect(cfg.data).toEqual(row);
  });

  it('removeCollection calls the service then reloads', async () => {
    await build({
      remove: jasmine.createSpy('remove').and.returnValue(of(undefined)),
      findPage: jasmine.createSpy('findPage').and.returnValue(of({ results: [], totalResults: 0 } as any))
    });
    component.removeCollection('c1');
    expect(collectionService.remove).toHaveBeenCalledWith('c1');
    expect(collectionService.findPage).toHaveBeenCalledTimes(1);
  });
});
