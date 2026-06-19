import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Renderer2 } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { of, throwError } from 'rxjs';

import { CollectionImagesComponent } from './collection-images.component';
import { CollectionService, ConfirmActionService } from '../../../../../../core/services';
import { mockDialogService, mockDynamicDialogRef, mockTranslocoService } from '../../../../../../../testing/test-helpers';

// Mirrors the ConfigureMediaImagesComponent stub pattern: behavior is driven through methods +
// service spies, not rendered DOM. Also proves the route-scoped DI (ConfirmActionService /
// DialogService) resolves from the surrounding injector tree (no NG0201).

const PNG_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const COLLECTION_ID = 'c1';
const COLLECTION_NAME = 'Saga';

function makeCollection(overrides: Partial<any> = {}): any {
  return {
    _id: COLLECTION_ID, name: COLLECTION_NAME, overview: 'ov', media: [], mediaCount: 3,
    posterUrl: 'p', thumbnailPosterUrl: 'tp', posterColor: 1, posterPlaceholder: 'pp',
    backdropUrl: 'b', thumbnailBackdropUrl: 'tb', backdropColor: 2, backdropPlaceholder: 'bp',
    ...overrides
  };
}

describe('CollectionImagesComponent', () => {
  let component: CollectionImagesComponent;
  let fixture: ComponentFixture<CollectionImagesComponent>;
  let collectionService: any;
  let dialogService: any;
  let confirmationService: ConfirmationService;

  function create(collection: any = makeCollection()) {
    collectionService = {
      uploadPoster: jasmine.createSpy('uploadPoster').and.returnValue(of({ thumbnailPosterUrl: 'new-poster' })),
      uploadBackdrop: jasmine.createSpy('uploadBackdrop').and.returnValue(of({ thumbnailBackdropUrl: 'new-backdrop' })),
      deletePoster: jasmine.createSpy('deletePoster').and.returnValue(of(undefined)),
      deleteBackdrop: jasmine.createSpy('deleteBackdrop').and.returnValue(of(undefined))
    };

    return TestBed.configureTestingModule({
      imports: [CollectionImagesComponent],
      providers: [
        { provide: DialogService, useValue: mockDialogService() },
        // Route-scoped tokens supplied by the surrounding injector, never by the child itself.
        ConfirmationService,
        ConfirmActionService,
        { provide: CollectionService, useValue: collectionService },
        { provide: TranslocoService, useValue: mockTranslocoService() }
      ]
    })
      .overrideComponent(CollectionImagesComponent, { set: { template: '', imports: [] } })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(CollectionImagesComponent);
        component = fixture.componentInstance;
        dialogService = TestBed.inject(DialogService) as any;
        confirmationService = TestBed.inject(ConfirmationService);
        fixture.componentRef.setInput('collection', collection);
        fixture.componentRef.setInput('t', (key: string) => key);
        fixture.componentRef.setInput('parentDialogRef', mockDynamicDialogRef());
        fixture.detectChanges();
      });
  }

  it('should create (injects route-scoped ConfirmActionService/DialogService without NG0201)', async () => {
    await create();
    expect(component).toBeTruthy();
  });

  it('onInputPosterChange sets posterPreviewName/Uri from the image editor result', async () => {
    await create();
    dialogService.open.and.returnValue({ ...mockDynamicDialogRef(), onClose: of(['preview-uri', 'poster.png']) });
    const event = { target: { files: [new File(['x'], 'poster.png')] } } as unknown as Event;
    component.onInputPosterChange(event);
    expect(component.posterPreviewName).toBe('poster.png');
    expect(component.posterPreviewUri).toBe('preview-uri');
  });

  it('onInputPosterChange throws when the chosen file exceeds IMAGE_PREVIEW_SIZE', async () => {
    await create();
    const big = new File([''], 'p.png');
    Object.defineProperty(big, 'size', { value: 8388608 + 1 });
    const event = { target: { files: [big] } } as unknown as Event;
    expect(() => component.onInputPosterChange(event)).toThrowError(/uploadPosterTooLarge/);
  });

  it('onInputBackdropChange throws when the chosen file exceeds IMAGE_PREVIEW_SIZE', async () => {
    await create();
    const big = new File([''], 'b.png');
    Object.defineProperty(big, 'size', { value: 8388608 + 1 });
    const event = { target: { files: [big] } } as unknown as Event;
    expect(() => component.onInputBackdropChange(event)).toThrowError(/uploadBackdropTooLarge/);
  });

  it('onUpdatePosterSubmit uploads multipart, emits the merged collection, clears the preview', async () => {
    await create();
    component.posterPreviewName = 'poster.png';
    component.posterPreviewUri = PNG_DATA_URI;
    let merged: any;
    component.collectionChange.subscribe(c => (merged = c));
    component.onUpdatePosterSubmit();
    const args = collectionService.uploadPoster.calls.mostRecent().args;
    expect(args[0]).toBe(COLLECTION_ID);
    expect(args[1] instanceof Blob).toBeTrue();
    expect(args[2]).toBe('poster.png');
    expect(merged._id).toBe(COLLECTION_ID);
    expect(merged.thumbnailPosterUrl).toBe('new-poster');
    expect(component.posterPreviewName).toBeUndefined();
    expect(component.isUpdatingPoster).toBeFalse();
  });

  it('onUpdatePosterSubmit is a no-op when there is no posterPreviewName', async () => {
    await create();
    component.posterPreviewName = undefined;
    component.onUpdatePosterSubmit();
    expect(collectionService.uploadPoster).not.toHaveBeenCalled();
  });

  it('onUpdateBackdropSubmit uploads and emits the merged collection', async () => {
    await create();
    component.backdropPreviewName = 'bd.png';
    component.backdropPreviewUri = PNG_DATA_URI;
    let merged: any;
    component.collectionChange.subscribe(c => (merged = c));
    component.onUpdateBackdropSubmit();
    expect(collectionService.uploadBackdrop).toHaveBeenCalledTimes(1);
    expect(merged.thumbnailBackdropUrl).toBe('new-backdrop');
    expect(component.backdropPreviewName).toBeUndefined();
    expect(component.isUpdatingBackdrop).toBeFalse();
  });

  it('cancel handlers clear the staged preview state', async () => {
    await create();
    component.posterPreviewName = 'x'; component.posterPreviewUri = 'y';
    component.onUpdatePosterCancel();
    expect(component.posterPreviewName).toBeUndefined();
    expect(component.posterPreviewUri).toBeUndefined();
    component.backdropPreviewName = 'x'; component.backdropPreviewUri = 'y';
    component.onUpdateBackdropCancel();
    expect(component.backdropPreviewName).toBeUndefined();
    expect(component.backdropPreviewUri).toBeUndefined();
  });

  it('deletePoster confirms in-modal then DELETEs + emits a poster-cleared collection', async () => {
    await create();
    const confirmSpy = spyOn(confirmationService, 'confirm');
    let merged: any;
    component.collectionChange.subscribe(c => (merged = c));
    component.deletePoster({ target: document.createElement('button') } as unknown as Event);
    const arg = confirmSpy.calls.mostRecent().args[0];
    expect(arg.key).toBe('inModal');
    expect(arg.header).toBe('admin.updateCollection.deletePosterConfirmationHeader');
    arg.accept!();
    expect(collectionService.deletePoster).toHaveBeenCalledWith(COLLECTION_ID);
    expect(merged.posterUrl).toBeUndefined();
    expect(merged.thumbnailPosterUrl).toBeUndefined();
    expect(merged.posterPlaceholder).toBeUndefined();
  });

  it('deleteBackdrop confirms in-modal then DELETEs + emits a backdrop-cleared collection', async () => {
    await create();
    const confirmSpy = spyOn(confirmationService, 'confirm');
    let merged: any;
    component.collectionChange.subscribe(c => (merged = c));
    component.deleteBackdrop({ target: document.createElement('button') } as unknown as Event);
    const arg = confirmSpy.calls.mostRecent().args[0];
    expect(arg.key).toBe('inModal');
    expect(arg.header).toBe('admin.updateCollection.deleteBackdropConfirmationHeader');
    arg.accept!();
    expect(collectionService.deleteBackdrop).toHaveBeenCalledWith(COLLECTION_ID);
    expect(merged.backdropUrl).toBeUndefined();
    expect(merged.thumbnailBackdropUrl).toBeUndefined();
    expect(merged.backdropPlaceholder).toBeUndefined();
  });

  it('deletePoster error path re-enables the trigger element', async () => {
    await create();
    const confirmSpy = spyOn(confirmationService, 'confirm');
    collectionService.deletePoster.and.returnValue(throwError(() => new Error('nope')));
    const button = document.createElement('button');
    const renderer = (component as any).renderer as Renderer2;
    const setProp = spyOn(renderer, 'setProperty').and.callThrough();
    component.deletePoster({ target: button } as unknown as Event);
    confirmSpy.calls.mostRecent().args[0].accept!();
    expect(setProp).toHaveBeenCalledWith(button, 'disabled', true);
    expect(setProp).toHaveBeenCalledWith(button, 'disabled', false);
  });
});
