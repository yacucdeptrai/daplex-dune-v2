import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Renderer2, Inject, ViewChild, input, output, DOCUMENT } from '@angular/core';
import { TranslocoService, TranslocoTranslateFn } from '@jsverse/transloco';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { first } from 'rxjs';

import { MediaDetails, MediaSubtitle } from '../../../../../../core/models';
import { ConfirmActionService, MediaService } from '../../../../../../core/services';
import { AddSubtitleComponent } from '../../../add-subtitle';
import { FileUploadComponent } from '../../../../../../shared/components/file-upload';
import { fixNestedDialogFocus } from '../../../../../../core/utils';
import { AppErrorCode } from '../../../../../../core/enums';
import { UPLOAD_SUBTITLE_SIZE } from '../../../../../../../environments/config';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SharedModule } from 'primeng/api';

// Movie subtitle tab extracted from ConfigureMediaComponent. Reads `media` via input and reports
// immutable subtitle replacements via `mediaChange`. Route-scoped DialogService / ConfirmActionService
// resolve up the shared dialog injector tree — never re-provided here. The episode-subtitle path
// stays with the parent's episode menu.
@Component({
  selector: 'app-configure-media-subtitles',
  templateUrl: './configure-media-subtitles.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, TableModule, SharedModule, FileUploadComponent]
})
export class ConfigureMediaSubtitlesComponent {
  @ViewChild('subtitleFileUpload') subtitleFileUpload?: FileUploadComponent;

  media = input.required<MediaDetails>();
  t = input.required<TranslocoTranslateFn>();
  parentDialogRef = input.required<DynamicDialogRef>();
  mediaChange = output<MediaDetails>();

  constructor(@Inject(DOCUMENT) private document: Document, private ref: ChangeDetectorRef, private renderer: Renderer2,
    private dialogService: DialogService, private confirmAction: ConfirmActionService,
    private mediaService: MediaService, private translocoService: TranslocoService) { }

  showAddSubtitleDialog(file?: File): void {
    const media = this.media();
    if (file && file.size > UPLOAD_SUBTITLE_SIZE)
      throw new Error(AppErrorCode.UPLOAD_SUBTITLE_TOO_LARGE);
    this.subtitleFileUpload?.clear();
    const dialogRef = this.dialogService.open(AddSubtitleComponent, {
      data: { media: { ...media }, episode: undefined, file: file },
      width: '500px',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm',
      contentStyle: { 'margin-top': '-1.5rem' }
    });
    dialogRef?.onClose.pipe(first()).subscribe((subtitles: MediaSubtitle[]) => {
      if (!subtitles) return;
      this.mediaChange.emit({ ...media, movie: { ...media.movie, subtitles } });
    });
    fixNestedDialogFocus(dialogRef, this.parentDialogRef(), this.dialogService, this.renderer, this.document);
  }

  deleteSubtitle(subtitle: MediaSubtitle, event: Event): void {
    const media = this.media();
    this.confirmAction.confirmDelete({
      key: 'inModal',
      message: this.translocoService.translate('admin.media.deleteSubtitleConfirmation'),
      header: this.translocoService.translate('admin.media.deleteSubtitleConfirmationHeader'),
      accept: () => {
        const element = event.target instanceof HTMLButtonElement ? event.target : <HTMLButtonElement>(<HTMLSpanElement>event.target).parentElement;
        this.renderer.setProperty(element, 'disabled', true);
        this.mediaService.deleteMovieSubtitle(media._id, subtitle._id).subscribe({
          next: () => {
            const subtitles = media.movie.subtitles.filter(v => v._id !== subtitle._id);
            this.mediaChange.emit({ ...media, movie: { ...media.movie, subtitles } });
          },
          error: () => {
            this.renderer.setProperty(element, 'disabled', false);
          }
        }).add(() => this.ref.markForCheck());
      }
    });
  }

  trackId(index: number, item: any): any {
    return item?._id;
  }
}
