import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Renderer2, Inject, input, output, DOCUMENT } from '@angular/core';
import { TranslocoService, TranslocoTranslateFn } from '@jsverse/transloco';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { EMPTY, Observable, first } from 'rxjs';

import { MediaDetails } from '../../../../../../core/models';
import { ConfirmActionService, MediaService } from '../../../../../../core/services';
import { ImageEditorComponent, ImageEditorConfig } from '../../../../../../shared/dialogs/image-editor';
import { dataURItoBlob, fixNestedDialogFocus, translocoEscape } from '../../../../../../core/utils';
import { AppErrorCode } from '../../../../../../core/enums';
import {
  IMAGE_PREVIEW_SIZE, UPLOAD_POSTER_SIZE, UPLOAD_BACKDROP_SIZE, UPLOAD_POSTER_MIN_WIDTH, UPLOAD_POSTER_MIN_HEIGHT,
  UPLOAD_BACKDROP_MIN_WIDTH, UPLOAD_BACKDROP_MIN_HEIGHT, UPLOAD_POSTER_ASPECT_WIDTH, UPLOAD_POSTER_ASPECT_HEIGHT,
  UPLOAD_BACKDROP_ASPECT_WIDTH, UPLOAD_BACKDROP_ASPECT_HEIGHT
} from '../../../../../../../environments/config';
import { ButtonModule } from 'primeng/button';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ThumbhashUrlPipe } from '../../../../../../shared/pipes/placeholder-pipe/thumbhash-url/thumbhash-url.pipe';

// Poster/backdrop editing extracted from ConfigureMediaComponent. Reads `media` via input
// and reports immutable replacements via `mediaChange`; `updated` mirrors the parent's
// poster-only isUpdated asymmetry. Route-scoped services (DialogService, ConfirmActionService)
// are injected so they resolve up the shared dialog injector tree — never re-provided here.
@Component({
  selector: 'app-configure-media-images',
  templateUrl: './configure-media-images.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, LazyLoadImageModule, ThumbhashUrlPipe]
})
export class ConfigureMediaImagesComponent {
  media = input.required<MediaDetails>();
  t = input.required<TranslocoTranslateFn>();
  parentDialogRef = input.required<DynamicDialogRef>();
  mediaChange = output<MediaDetails>();
  updated = output<void>();

  isUpdatingPoster: boolean = false;
  isUpdatingBackdrop: boolean = false;
  posterPreviewName?: string;
  backdropPreviewName?: string;
  posterPreviewUri?: string;
  backdropPreviewUri?: string;

  constructor(@Inject(DOCUMENT) private document: Document, private ref: ChangeDetectorRef, private renderer: Renderer2,
    private dialogService: DialogService, private confirmAction: ConfirmActionService,
    private mediaService: MediaService, private translocoService: TranslocoService) { }

  onInputPosterChange(event: Event): void {
    const element = <HTMLInputElement>event.target;
    if (!element.files?.length || !this.media()) return;
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
    if (!element.files?.length || !this.media()) return;
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
    const dialogRef = this.dialogService.open(ImageEditorComponent, {
      data: data,
      header: this.translocoService.translate('common.imageEditor.header'),
      width: '700px',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm'
    });
    fixNestedDialogFocus(dialogRef, this.parentDialogRef(), this.dialogService, this.renderer, this.document);
    if (!dialogRef) return EMPTY;
    return dialogRef.onClose.pipe(first());
  }

  onUpdatePosterSubmit(): void {
    if (!this.posterPreviewName) return;
    this.isUpdatingPoster = true;
    const media = this.media();
    const posterBlob = dataURItoBlob(this.posterPreviewUri!);
    this.mediaService.uploadPoster(media._id, posterBlob, this.posterPreviewName).subscribe({
      next: (paritalMedia) => {
        this.posterPreviewName = undefined;
        this.posterPreviewUri = undefined;
        this.mediaChange.emit({ ...media, ...paritalMedia });
        this.updated.emit();
      }
    }).add(() => {
      this.isUpdatingPoster = false;
      this.ref.markForCheck();
    });
  }

  onUpdateBackdropSubmit(): void {
    if (!this.backdropPreviewName) return;
    this.isUpdatingBackdrop = true;
    const media = this.media();
    const backdropBlob = dataURItoBlob(this.backdropPreviewUri!);
    this.mediaService.uploadBackdrop(media._id, backdropBlob, this.backdropPreviewName).subscribe({
      next: (paritalMedia) => {
        this.backdropPreviewName = undefined;
        this.backdropPreviewUri = undefined;
        this.mediaChange.emit({ ...media, ...paritalMedia });
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
    const media = this.media();
    const safeMediaTitle = translocoEscape(media.title);
    this.confirmAction.confirmDelete({
      key: 'inModal',
      message: this.translocoService.translate('admin.media.deletePosterConfirmation', { name: safeMediaTitle }),
      header: this.translocoService.translate('admin.media.deletePosterConfirmationHeader'),
      accept: () => {
        const element = event.target instanceof HTMLButtonElement ? event.target : <HTMLButtonElement>(<HTMLSpanElement>event.target).parentElement;
        this.renderer.setProperty(element, 'disabled', true);
        this.mediaService.deletePoster(media._id).subscribe({
          next: () => {
            this.mediaChange.emit({
              ...media, posterUrl: undefined, thumbnailPosterUrl: undefined, smallPosterUrl: undefined, fullPosterUrl: undefined,
              posterColor: undefined, posterPlaceholder: undefined
            });
            this.updated.emit();
          },
          error: () => {
            this.renderer.setProperty(element, 'disabled', false);
          }
        }).add(() => this.ref.markForCheck());
      }
    });
  }

  deleteBackdrop(event: Event): void {
    const media = this.media();
    const safeMediaTitle = translocoEscape(media.title);
    this.confirmAction.confirmDelete({
      key: 'inModal',
      message: this.translocoService.translate('admin.media.deleteBackdropConfirmation', { name: safeMediaTitle }),
      header: this.translocoService.translate('admin.media.deleteBackdropConfirmationHeader'),
      accept: () => {
        const element = event.target instanceof HTMLButtonElement ? event.target : <HTMLButtonElement>(<HTMLSpanElement>event.target).parentElement;
        this.renderer.setProperty(element, 'disabled', true);
        this.mediaService.deleteBackdrop(media._id).subscribe({
          next: () => {
            this.mediaChange.emit({
              ...media, backdropUrl: undefined, thumbnailBackdropUrl: undefined, smallBackdropUrl: undefined,
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
