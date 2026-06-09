import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Renderer2, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslocoService, TranslocoTranslateFn } from '@jsverse/transloco';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

import { MediaDetails, MediaStream } from '../../../../../../core/models';
import { ConfirmActionService, MediaService, QueueUploadService } from '../../../../../../core/services';
import { FileUploadComponent } from '../../../../../../shared/components/file-upload';
import { VideoPlayerComponent } from '../../../../../../shared/components/video-player';
import { translocoEscape } from '../../../../../../core/utils';
import { MediaPStatus, MediaSourceStatus } from '../../../../../../core/enums';
import { ButtonModule } from 'primeng/button';
import { SharedModule } from 'primeng/api';

// Movie source upload + preview tab extracted from ConfigureMediaComponent. Reads `media` via input;
// the optimistic delete-source status->PENDING change bubbles up immutably via `mediaChange` while
// the authoritative socket reducer (updateMovieSourceStatus) stays with the parent and flows refreshed
// media back down the input. Route-scoped ConfirmActionService / QueueUploadService resolve up the
// shared dialog injector tree — never re-provided here. The confirm-dialog (key:'inModal') and the
// add-source dialog stay in the parent; this tab opens no nested dialog (parentDialogRef parity-only).
@Component({
  selector: 'app-configure-media-source',
  templateUrl: './configure-media-source.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, FileUploadComponent, VideoPlayerComponent, NgTemplateOutlet, SharedModule]
})
export class ConfigureMediaSourceComponent implements OnInit {
  MediaSourceStatus = MediaSourceStatus;

  media = input.required<MediaDetails>();
  t = input.required<TranslocoTranslateFn>();
  parentDialogRef = input.required<DynamicDialogRef>();
  mediaChange = output<MediaDetails>();
  updated = output<void>();

  isUploadingSource: boolean = false;
  showMoviePlayer: boolean = false;
  previewStream?: MediaStream;

  constructor(private ref: ChangeDetectorRef, private renderer: Renderer2,
    private confirmAction: ConfirmActionService, private mediaService: MediaService,
    private queueUploadService: QueueUploadService, private translocoService: TranslocoService) { }

  ngOnInit(): void {
    this.checkUploadInQueue();
  }

  checkUploadInQueue(): void {
    this.isUploadingSource = this.queueUploadService.isMediaInQueue(this.media()._id);
  }

  uploadSource(file: File): void {
    const mediaId = this.media()._id;
    this.queueUploadService.addToQueue(mediaId, file, `media/${mediaId}/movie/source`, `media/${mediaId}/movie/source/:id`);
    this.isUploadingSource = true;
    this.ref.markForCheck();
  }

  showSourcePreview(): void {
    this.showMoviePlayer = true;
    this.mediaService.findMovieStreams(this.media()._id, { preview: true }).subscribe((movie) => {
      this.previewStream = movie;
      this.ref.markForCheck();
    });
  }

  deleteSource(event: Event): void {
    const media = this.media();
    const safeMediaTitle = translocoEscape(media.title);
    this.confirmAction.confirmDelete({
      key: 'inModal',
      message: this.translocoService.translate('admin.media.deleteSourceConfirmation', { name: safeMediaTitle }),
      header: this.translocoService.translate('admin.media.deleteSourceConfirmationHeader'),
      accept: () => {
        const element = event.target instanceof HTMLButtonElement ? event.target : <HTMLButtonElement>(<HTMLSpanElement>event.target).parentElement;
        this.renderer.setProperty(element, 'disabled', true);
        this.mediaService.deleteMovieSource(media._id).subscribe({
          next: () => {
            this.mediaChange.emit({ ...media, movie: { ...media.movie, status: MediaSourceStatus.PENDING }, pStatus: MediaPStatus.PENDING });
            this.checkUploadInQueue();
            this.updated.emit();
          }
        }).add(() => {
          this.renderer.setProperty(element, 'disabled', false);
          this.ref.markForCheck();
        });
      }
    });
  }
}
