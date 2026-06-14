import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Renderer2, Inject, input, output, DOCUMENT } from '@angular/core';
import { TranslocoService, TranslocoTranslateFn } from '@jsverse/transloco';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { first } from 'rxjs';

import { MediaDetails, MediaVideo } from '../../../../../../core/models';
import { ConfirmActionService, MediaService } from '../../../../../../core/services';
import { AddVideoComponent } from '../../../add-video';
import { UpdateVideoComponent } from '../../../update-video';
import { fixNestedDialogFocus } from '../../../../../../core/utils';
import { YOUTUBE_EMBED_URL, YOUTUBE_THUMBNAIL_URL } from '../../../../../../../environments/config';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
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
  imports: [ButtonModule, TableModule, DialogModule, SharedModule, SafeUrlPipe]
})
export class ConfigureMediaVideosComponent {
  media = input.required<MediaDetails>();
  t = input.required<TranslocoTranslateFn>();
  parentDialogRef = input.required<DynamicDialogRef>();
  mediaChange = output<MediaDetails>();

  loadingVideo: boolean = false;
  displayVideo: boolean = false;
  activeVideoIndex: number = 0;
  youtubeUrl = YOUTUBE_EMBED_URL;
  youtubeThumbnailUrl = YOUTUBE_THUMBNAIL_URL;

  constructor(@Inject(DOCUMENT) private document: Document, private ref: ChangeDetectorRef, private renderer: Renderer2,
    private dialogService: DialogService, private confirmAction: ConfirmActionService,
    private mediaService: MediaService, private translocoService: TranslocoService) { }

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
    const dialogRef = this.dialogService.open(AddVideoComponent, {
      data: { ...media },
      width: '700px',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm',
      contentStyle: { 'margin-top': '-1.5rem' }
    });
    dialogRef?.onClose.pipe(first()).subscribe((videos: MediaVideo[]) => {
      if (!videos) return;
      this.mediaChange.emit({ ...media, videos: [...videos] });
    });
    fixNestedDialogFocus(dialogRef, this.parentDialogRef(), this.dialogService, this.renderer, this.document);
  }

  showUpdateVideoDialog(video: MediaVideo): void {
    const media = this.media();
    const dialogRef = this.dialogService.open(UpdateVideoComponent, {
      data: { media: { ...media }, video: { ...video } },
      width: '700px',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm',
      contentStyle: { 'margin-top': '-1.5rem' }
    });
    dialogRef?.onClose.pipe(first()).subscribe((videos: MediaVideo[]) => {
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
