import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Renderer2, Inject, input, output, DOCUMENT } from '@angular/core';
import { TranslocoService, TranslocoTranslateFn } from '@jsverse/transloco';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable, first } from 'rxjs';

import { MediaCollectionDetails } from '../../../../../../core/models';
import { CollectionService, ConfirmActionService } from '../../../../../../core/services';
import { ImageEditorComponent, ImageEditorConfig } from '../../../../../../shared/dialogs/image-editor';
import { openDialog, dataURItoBlob, fixNestedDialogFocus, translocoEscape } from '../../../../../../core/utils';
import { AppErrorCode } from '../../../../../../core/enums';
import {
  IMAGE_PREVIEW_SIZE, UPLOAD_POSTER_SIZE, UPLOAD_BACKDROP_SIZE, UPLOAD_POSTER_MIN_WIDTH, UPLOAD_POSTER_MIN_HEIGHT,
  UPLOAD_BACKDROP_MIN_WIDTH, UPLOAD_BACKDROP_MIN_HEIGHT, UPLOAD_POSTER_ASPECT_WIDTH, UPLOAD_POSTER_ASPECT_HEIGHT,
  UPLOAD_BACKDROP_ASPECT_WIDTH, UPLOAD_BACKDROP_ASPECT_HEIGHT
} from '../../../../../../../environments/config';
import { ButtonModule } from 'primeng/button';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ThumbhashUrlPipe } from '../../../../../../shared/pipes/placeholder-pipe/thumbhash-url/thumbhash-url.pipe';

// Collection poster/backdrop editing, mirroring ConfigureMediaImagesComponent. Reads `collection`
// via input and reports immutable replacements via `collectionChange`. Route-scoped services
// (DialogService, ConfirmActionService) inject up the shared dialog injector tree — never re-provided.
@Component({
  selector: 'app-collection-images',
  templateUrl: './collection-images.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, LazyLoadImageModule, ThumbhashUrlPipe]
})
export class CollectionImagesComponent {
  collection = input.required<MediaCollectionDetails>();
  t = input.required<TranslocoTranslateFn>();
  parentDialogRef = input.required<DynamicDialogRef>();
  collectionChange = output<MediaCollectionDetails>();

  isUpdatingPoster: boolean = false;
  isUpdatingBackdrop: boolean = false;
  posterPreviewName?: string;
  backdropPreviewName?: string;
  posterPreviewUri?: string;
  backdropPreviewUri?: string;

  constructor(@Inject(DOCUMENT) private document: Document, private ref: ChangeDetectorRef, private renderer: Renderer2,
    private dialogService: DialogService, private confirmAction: ConfirmActionService,
    private collectionService: CollectionService, private translocoService: TranslocoService) { }

  onInputPosterChange(event: Event): void {
    const element = <HTMLInputElement>event.target;
    if (!element.files?.length || !this.collection()) return;
    if (element.files[0].size > IMAGE_PREVIEW_SIZE)
      throw new Error(AppErrorCode.UPLOAD_POSTER_TOO_LARGE);
    this.editImage({
      aspectRatioWidth: UPLOAD_POSTER_ASPECT_WIDTH, aspectRatioHeight: UPLOAD_POSTER_ASPECT_HEIGHT,
      minWidth: UPLOAD_POSTER_MIN_WIDTH, minHeight: UPLOAD_POSTER_MIN_HEIGHT,
      imageFile: element.files[0], maxSize: UPLOAD_POSTER_SIZE
    }).subscribe(result => {
      if (!result) return;
      const [previewUri, name] = result;
      this.posterPreviewName = name;
      this.posterPreviewUri = previewUri;
      this.ref.markForCheck();
    });
  }

  onInputBackdropChange(event: Event): void {
    const element = <HTMLInputElement>event.target;
    if (!element.files?.length || !this.collection()) return;
    if (element.files[0].size > IMAGE_PREVIEW_SIZE)
      throw new Error(AppErrorCode.UPLOAD_BACKDROP_TOO_LARGE);
    this.editImage({
      aspectRatioWidth: UPLOAD_BACKDROP_ASPECT_WIDTH, aspectRatioHeight: UPLOAD_BACKDROP_ASPECT_HEIGHT,
      minWidth: UPLOAD_BACKDROP_MIN_WIDTH, minHeight: UPLOAD_BACKDROP_MIN_HEIGHT,
      imageFile: element.files[0], maxSize: UPLOAD_BACKDROP_SIZE
    }).subscribe(result => {
      if (!result) return;
      const [previewUri, name] = result;
      this.backdropPreviewName = name;
      this.backdropPreviewUri = previewUri;
      this.ref.markForCheck();
    });
  }

  editImage(data: ImageEditorConfig): Observable<string[] | null> {
    const dialogRef = openDialog(this.dialogService, ImageEditorComponent, {
      data: data,
      header: this.translocoService.translate('common.imageEditor.header'),
      width: '700px',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm'
    });
    fixNestedDialogFocus(dialogRef, this.parentDialogRef(), this.dialogService, this.renderer, this.document);
    return dialogRef.onClose.pipe(first());
  }

  onUpdatePosterSubmit(): void {
    if (!this.posterPreviewName) return;
    this.isUpdatingPoster = true;
    const collection = this.collection();
    const posterBlob = dataURItoBlob(this.posterPreviewUri!);
    this.collectionService.uploadPoster(collection._id, posterBlob, this.posterPreviewName).subscribe({
      next: (partial) => {
        this.posterPreviewName = undefined;
        this.posterPreviewUri = undefined;
        this.collectionChange.emit({ ...collection, ...partial });
      }
    }).add(() => {
      this.isUpdatingPoster = false;
      this.ref.markForCheck();
    });
  }

  onUpdateBackdropSubmit(): void {
    if (!this.backdropPreviewName) return;
    this.isUpdatingBackdrop = true;
    const collection = this.collection();
    const backdropBlob = dataURItoBlob(this.backdropPreviewUri!);
    this.collectionService.uploadBackdrop(collection._id, backdropBlob, this.backdropPreviewName).subscribe({
      next: (partial) => {
        this.backdropPreviewName = undefined;
        this.backdropPreviewUri = undefined;
        this.collectionChange.emit({ ...collection, ...partial });
      }
    }).add(() => {
      this.isUpdatingBackdrop = false;
      this.ref.markForCheck();
    });
  }

  onUpdatePosterCancel(): void {
    this.posterPreviewName = undefined;
    this.posterPreviewUri = undefined;
    this.ref.markForCheck();
  }

  onUpdateBackdropCancel(): void {
    this.backdropPreviewName = undefined;
    this.backdropPreviewUri = undefined;
    this.ref.markForCheck();
  }

  deletePoster(event: Event): void {
    const collection = this.collection();
    const safeName = translocoEscape(collection.name);
    this.confirmAction.confirmDelete({
      key: 'inModal',
      message: this.translocoService.translate('admin.updateCollection.deletePosterConfirmation', { name: safeName }),
      header: this.translocoService.translate('admin.updateCollection.deletePosterConfirmationHeader'),
      accept: () => {
        const element = event.target instanceof HTMLButtonElement ? event.target : <HTMLButtonElement>(<HTMLSpanElement>event.target).parentElement;
        this.renderer.setProperty(element, 'disabled', true);
        this.collectionService.deletePoster(collection._id).subscribe({
          next: () => {
            this.collectionChange.emit({
              ...collection, posterUrl: undefined, thumbnailPosterUrl: undefined, smallPosterUrl: undefined,
              fullPosterUrl: undefined, posterColor: undefined, posterPlaceholder: undefined
            });
          },
          error: () => {
            this.renderer.setProperty(element, 'disabled', false);
          }
        }).add(() => this.ref.markForCheck());
      }
    });
  }

  deleteBackdrop(event: Event): void {
    const collection = this.collection();
    const safeName = translocoEscape(collection.name);
    this.confirmAction.confirmDelete({
      key: 'inModal',
      message: this.translocoService.translate('admin.updateCollection.deleteBackdropConfirmation', { name: safeName }),
      header: this.translocoService.translate('admin.updateCollection.deleteBackdropConfirmationHeader'),
      accept: () => {
        const element = event.target instanceof HTMLButtonElement ? event.target : <HTMLButtonElement>(<HTMLSpanElement>event.target).parentElement;
        this.renderer.setProperty(element, 'disabled', true);
        this.collectionService.deleteBackdrop(collection._id).subscribe({
          next: () => {
            this.collectionChange.emit({
              ...collection, backdropUrl: undefined, thumbnailBackdropUrl: undefined, smallBackdropUrl: undefined,
              fullBackdropUrl: undefined, backdropColor: undefined, backdropPlaceholder: undefined
            });
          },
          error: () => {
            this.renderer.setProperty(element, 'disabled', false);
          }
        }).add(() => this.ref.markForCheck());
      }
    });
  }
}
