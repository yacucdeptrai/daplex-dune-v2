import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Renderer2, Inject, input, output, DOCUMENT } from '@angular/core';
import { TranslocoService, TranslocoTranslateFn } from '@jsverse/transloco';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable, first } from 'rxjs';

import { MediaDetails, ScannerImageItem } from '../../../../../../core/models';
import { ConfirmActionService, MediaScannerService, MediaService } from '../../../../../../core/services';
import { ImageEditorComponent, ImageEditorConfig } from '../../../../../../shared/dialogs/image-editor';
import { openDialog, dataURItoBlob, fixNestedDialogFocus, translocoEscape } from '../../../../../../core/utils';
import { AppErrorCode, MediaType } from '../../../../../../core/enums';
import { MediaImageChooserComponent } from '../../../media-image-chooser/media-image-chooser.component';
import {
  IMAGE_PREVIEW_SIZE, UPLOAD_POSTER_SIZE, UPLOAD_BACKDROP_SIZE, UPLOAD_POSTER_MIN_WIDTH, UPLOAD_POSTER_MIN_HEIGHT,
  UPLOAD_BACKDROP_MIN_WIDTH, UPLOAD_BACKDROP_MIN_HEIGHT, UPLOAD_POSTER_ASPECT_WIDTH, UPLOAD_POSTER_ASPECT_HEIGHT,
  UPLOAD_BACKDROP_ASPECT_WIDTH, UPLOAD_BACKDROP_ASPECT_HEIGHT
} from '../../../../../../../environments/config';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
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
  imports: [ButtonModule, TooltipModule, LazyLoadImageModule, ThumbhashUrlPipe]
})
export class ConfigureMediaImagesComponent {
  media = input.required<MediaDetails>();
  t = input.required<TranslocoTranslateFn>();
  parentDialogRef = input.required<DynamicDialogRef>();
  mediaChange = output<MediaDetails>();
  updated = output<void>();

  isUpdatingPoster: boolean = false;
  isUpdatingBackdrop: boolean = false;
  isImportingPoster: boolean = false;
  isImportingBackdrop: boolean = false;
  posterPreviewName?: string;
  backdropPreviewName?: string;
  posterPreviewUri?: string;
  backdropPreviewUri?: string;

  constructor(@Inject(DOCUMENT) private document: Document, private ref: ChangeDetectorRef, private renderer: Renderer2,
    private dialogService: DialogService, private confirmAction: ConfirmActionService,
    private mediaService: MediaService, private mediaScannerService: MediaScannerService,
    private translocoService: TranslocoService) { }

  // Provider resolution for the import-from-provider action. The ids type as number but seed null in
  // practice, so falsy is treated as absent; tmdb is preferred over tvdb (matches scanEpisode/import).
  private resolveProvider(): { provider: string; providerId: number } | null {
    const ids = this.media().externalIds;
    if (ids?.tmdb) return { provider: 'tmdb', providerId: ids.tmdb };
    if (ids?.tvdb) return { provider: 'tvdb', providerId: ids.tvdb };
    return null;
  }

  get canImport(): boolean {
    return this.resolveProvider() !== null;
  }

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

  onImportPoster(): void {
    const resolved = this.resolveProvider();
    if (!resolved || this.isImportingPoster) return;
    this.isImportingPoster = true;
    const media = this.media();
    // The flag spans fetch -> async chooser -> upload as one phase. Once the chooser opens it owns the
    // flag (the onClose handler clears on dismiss; applyImportedPoster clears when the upload settles);
    // the findImages finalizer only clears when no chooser opened (the fetch errored).
    let chooserOpened = false;
    this.mediaScannerService.findImages(resolved.providerId, { provider: resolved.provider, type: media.type as MediaType })
      .pipe(first()).subscribe({
        next: (images) => {
          chooserOpened = true;
          this.openChooser('poster', images.posters).subscribe(fileUrl => {
            if (fileUrl) {
              this.applyImportedPoster(media, fileUrl);
            } else {
              this.isImportingPoster = false;
              this.ref.markForCheck();
            }
          });
        }
      }).add(() => {
        if (!chooserOpened) {
          this.isImportingPoster = false;
          this.ref.markForCheck();
        }
      });
  }

  onImportBackdrop(): void {
    const resolved = this.resolveProvider();
    if (!resolved || this.isImportingBackdrop) return;
    this.isImportingBackdrop = true;
    const media = this.media();
    let chooserOpened = false;
    this.mediaScannerService.findImages(resolved.providerId, { provider: resolved.provider, type: media.type as MediaType })
      .pipe(first()).subscribe({
        next: (images) => {
          chooserOpened = true;
          this.openChooser('backdrop', images.backdrops).subscribe(fileUrl => {
            if (fileUrl) {
              this.applyImportedBackdrop(media, fileUrl);
            } else {
              this.isImportingBackdrop = false;
              this.ref.markForCheck();
            }
          });
        }
      }).add(() => {
        if (!chooserOpened) {
          this.isImportingBackdrop = false;
          this.ref.markForCheck();
        }
      });
  }

  // Opens the provider-image chooser focus-trapped over the configure-media dialog (same wiring as
  // editImage) and resolves with the chosen fileUrl (or undefined on dismiss).
  private openChooser(kind: 'poster' | 'backdrop', items: ScannerImageItem[]): Observable<string | undefined> {
    const dialogRef = openDialog(this.dialogService, MediaImageChooserComponent, {
      data: { items, kind },
      header: this.translocoService.translate('admin.imageChooser.header'),
      width: '700px',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm'
    });
    fixNestedDialogFocus(dialogRef, this.parentDialogRef(), this.dialogService, this.renderer, this.document);
    return dialogRef.onClose.pipe(first());
  }

  // The import flag is already set by the opener and held across the async chooser close; this owns
  // the single clear when the upload settles.
  private applyImportedPoster(media: MediaDetails, fileUrl: string): void {
    this.mediaService.uploadPosterFromUrl(media._id, fileUrl).subscribe({
      next: (paritalMedia) => {
        this.mediaChange.emit({ ...media, ...paritalMedia });
        this.updated.emit();
      }
    }).add(() => {
      this.isImportingPoster = false;
      this.ref.markForCheck();
    });
  }

  private applyImportedBackdrop(media: MediaDetails, fileUrl: string): void {
    this.mediaService.uploadBackdropFromUrl(media._id, fileUrl).subscribe({
      next: (paritalMedia) => {
        this.mediaChange.emit({ ...media, ...paritalMedia });
      }
    }).add(() => {
      this.isImportingBackdrop = false;
      this.ref.markForCheck();
    });
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
