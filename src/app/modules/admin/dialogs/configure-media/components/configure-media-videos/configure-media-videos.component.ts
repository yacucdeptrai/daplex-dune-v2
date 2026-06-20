import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Renderer2, Inject, input, output, DOCUMENT } from '@angular/core';
import { TranslocoService, TranslocoTranslateFn } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { first, from, concatMap, last } from 'rxjs';

import { MediaDetails, MediaVideo, ScannerVideoItem } from '../../../../../../core/models';
import { MediaType, ToastKey } from '../../../../../../core/enums';
import { ConfirmActionService, MediaScannerService, MediaService } from '../../../../../../core/services';
import { AddVideoComponent } from '../../../add-video';
import { UpdateVideoComponent } from '../../../update-video';
import { MediaVideoChooserComponent } from '../../../media-video-chooser/media-video-chooser.component';
import { openDialog, fixNestedDialogFocus } from '../../../../../../core/utils';
import { YOUTUBE_EMBED_URL, YOUTUBE_THUMBNAIL_URL } from '../../../../../../../environments/config';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { SharedModule } from 'primeng/api';
import { SafeUrlPipe } from '../../../../../../shared/pipes/url-pipe/safe-url/safe-url.pipe';

// Movie trailer/videos tab extracted from ConfigureMediaComponent. Reads `media` via input and
// reports immutable video replacements via `mediaChange`. Route-scoped DialogService /
// ConfirmActionService resolve up the shared dialog injector tree — never re-provided here. The
// socket reducer (updateMediaVideos) stays with the parent and flows refreshed media down the input.
@Component({
  selector: 'app-configure-media-videos',
  templateUrl: './configure-media-videos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, TableModule, DialogModule, TooltipModule, SharedModule, SafeUrlPipe]
})
export class ConfigureMediaVideosComponent {
  media = input.required<MediaDetails>();
  t = input.required<TranslocoTranslateFn>();
  parentDialogRef = input.required<DynamicDialogRef>();
  mediaChange = output<MediaDetails>();

  loadingVideo: boolean = false;
  displayVideo: boolean = false;
  activeVideoIndex: number = 0;
  isImportingVideos: boolean = false;
  youtubeUrl = YOUTUBE_EMBED_URL;
  youtubeThumbnailUrl = YOUTUBE_THUMBNAIL_URL;

  constructor(@Inject(DOCUMENT) private document: Document, private ref: ChangeDetectorRef, private renderer: Renderer2,
    private dialogService: DialogService, private confirmAction: ConfirmActionService,
    private mediaService: MediaService, private mediaScannerService: MediaScannerService,
    private messageService: MessageService, private translocoService: TranslocoService) { }

  // tmdb preferred over tvdb; ids type as number but seed null in practice, so falsy is absent.
  private resolveProvider(): { provider: string; providerId: number } | null {
    const ids = this.media().externalIds;
    if (ids?.tmdb) return { provider: 'tmdb', providerId: ids.tmdb };
    if (ids?.tvdb) return { provider: 'tvdb', providerId: ids.tvdb };
    return null;
  }

  get canImportVideos(): boolean {
    return this.resolveProvider() !== null;
  }

  importFromProvider(): void {
    const resolved = this.resolveProvider();
    if (!resolved || this.isImportingVideos) return;
    this.isImportingVideos = true;
    const media = this.media();
    // The flag spans fetch -> async chooser -> sequential import as one phase. Once the chooser opens
    // it owns the flag; the findOne finalizer only clears when no chooser opened (empty/all-present/error).
    let chooserOpened = false;
    this.mediaScannerService.findOne(resolved.providerId, { provider: resolved.provider, type: media.type as MediaType })
      .pipe(first()).subscribe({
        next: (details) => {
          const providerVideos = details.videos ?? [];
          if (!providerVideos.length) {
            this.notify('admin.videoChooser.noProviderVideos');
            return;
          }
          // Dedup against already-present keys.
          const existingKeys = new Set(media.videos.map(v => v.key));
          const importable = providerVideos.filter(v => !existingKeys.has(v.key));
          if (!importable.length) {
            this.notify('admin.videoChooser.noImportableVideos');
            return;
          }
          chooserOpened = true;
          this.openChooser(importable).subscribe(selection => {
            if (selection?.length) {
              this.importSequentially(media, selection);
            } else {
              this.isImportingVideos = false;
              this.ref.markForCheck();
            }
          });
        }
      }).add(() => {
        if (!chooserOpened) {
          this.isImportingVideos = false;
          this.ref.markForCheck();
        }
      });
  }

  // Opens the multi-select trailer chooser focus-trapped over the configure-media dialog; resolves with
  // the chosen ScannerVideoItem[] (null on cancel).
  private openChooser(items: ScannerVideoItem[]) {
    const dialogRef = openDialog(this.dialogService, MediaVideoChooserComponent, {
      data: { items },
      header: this.translocoService.translate('admin.videoChooser.header'),
      width: '700px',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm'
    });
    fixNestedDialogFocus(dialogRef, this.parentDialogRef(), this.dialogService, this.renderer, this.document);
    return dialogRef.onClose.pipe(first());
  }

  // Imports SEQUENTIALLY (concatMap) — the BE addMediaVideo does findOne->push->save per request, so
  // concurrent POSTs lost-update. concatMap subscribes (fires the POST) one at a time, only after the
  // previous settles. Each POST returns the full MediaVideo[]; the LAST is authoritative.
  private importSequentially(media: MediaDetails, selection: ScannerVideoItem[]): void {
    from(selection).pipe(
      concatMap(v => this.mediaService.importVideoFromScan(media._id, { key: v.key, name: v.name, official: v.official })),
      last()
    ).subscribe({
      next: (videos) => {
        this.mediaChange.emit({ ...media, videos });
        this.notify('admin.videoChooser.imported', 'success');
      },
      // http-error interceptor owns the toast; swallow here so a failed POST is no unhandled error.
      error: () => { }
    }).add(() => {
      this.isImportingVideos = false;
      this.ref.markForCheck();
    });
  }

  private notify(detailKey: string, severity: 'info' | 'success' = 'info'): void {
    this.messageService.add({
      key: ToastKey.APP, severity,
      summary: this.translocoService.translate('admin.configureMedia.importFromProvider'),
      detail: this.translocoService.translate(detailKey), life: 6000
    });
  }

  loadVideos(): void {
    const media = this.media();
    this.loadingVideo = true;
    this.mediaService.findAllVideos(media._id).subscribe(videos => {
      this.mediaChange.emit({ ...media, videos });
    }).add(() => {
      this.loadingVideo = false;
      this.ref.markForCheck();
    });
  }

  viewVideo(index: number): void {
    if (this.loadingVideo) return;
    this.activeVideoIndex = index;
    this.displayVideo = true;
  }

  showAddVideoDialog(): void {
    const media = this.media();
    const dialogRef = openDialog(this.dialogService, AddVideoComponent, {
      data: { ...media },
      width: '700px',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm app-form-dialog'
    });
    dialogRef.onClose.pipe(first()).subscribe((videos: MediaVideo[]) => {
      if (!videos) return;
      this.mediaChange.emit({ ...media, videos: [...videos] });
    });
    fixNestedDialogFocus(dialogRef, this.parentDialogRef(), this.dialogService, this.renderer, this.document);
  }

  showUpdateVideoDialog(video: MediaVideo): void {
    const media = this.media();
    const dialogRef = openDialog(this.dialogService, UpdateVideoComponent, {
      data: { media: { ...media }, video: { ...video } },
      width: '700px',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm app-form-dialog'
    });
    dialogRef.onClose.pipe(first()).subscribe((videos: MediaVideo[]) => {
      if (!videos) return;
      this.mediaChange.emit({ ...media, videos });
    });
    fixNestedDialogFocus(dialogRef, this.parentDialogRef(), this.dialogService, this.renderer, this.document);
  }

  deleteVideo(video: MediaVideo, event: Event): void {
    const media = this.media();
    this.confirmAction.confirmDelete({
      key: 'inModal',
      message: this.translocoService.translate('admin.media.deleteVideoConfirmation'),
      header: this.translocoService.translate('admin.media.deleteVideoConfirmationHeader'),
      accept: () => {
        const element = event.target instanceof HTMLButtonElement ? event.target : <HTMLButtonElement>(<HTMLSpanElement>event.target).parentElement;
        this.renderer.setProperty(element, 'disabled', true);
        this.mediaService.deleteVideo(media._id, video._id).subscribe({
          next: () => {
            const videos = media.videos.filter(v => v._id !== video._id);
            this.mediaChange.emit({ ...media, videos: [...videos] });
          },
          error: () => {
            this.renderer.setProperty(element, 'disabled', false);
          }
        }).add(() => this.ref.markForCheck());
      }
    });
  }

  blockScroll(): void {
    this.renderer.addClass(this.document.body, 'p-overflow-hidden');
  }

  trackId(index: number, item: any): any {
    return item?._id;
  }
}
