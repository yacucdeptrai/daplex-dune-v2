import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Renderer2, Inject, input, output, DOCUMENT } from '@angular/core';
import { TranslocoService, TranslocoTranslateFn } from '@jsverse/transloco';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Menu, MenuModule } from 'primeng/menu';
import { first, map, Observable } from 'rxjs';

import { MediaDetails, MediaSubtitle, TVEpisode } from '../../../../../../core/models';
import { ConfirmActionService, MediaService, QueueUploadService } from '../../../../../../core/services';
import { DataMenuItem } from '../../../../../../core/interfaces/primeng';
import { AddSubtitleComponent } from '../../../add-subtitle';
import { CreateEpisodeComponent } from '../../../create-episode';
import { ConfigureEpisodeComponent } from '../../../configure-episode';
import { AddSourceComponent } from '../../../add-source';
import { fixNestedDialogFocus } from '../../../../../../core/utils';
import { AppErrorCode, MediaPStatus, MediaSourceStatus } from '../../../../../../core/enums';
import { UPLOAD_SUBTITLE_SIZE } from '../../../../../../../environments/config';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ThumbhashUrlPipe } from '../../../../../../shared/pipes/placeholder-pipe/thumbhash-url/thumbhash-url.pipe';
import { ShortDatePipe } from '../../../../../../shared/pipes/date-time-pipe/short-date/short-date.pipe';
import { TimePipe } from '../../../../../../shared/pipes/date-time-pipe/time/time.pipe';

// TV episode list + per-episode context menu and the create/configure/delete/add-subtitle/add-source
// nested dialogs, extracted from ConfigureMediaComponent. Seeds its own `episodes` from
// media().tv.episodes on init and refreshes via loadEpisodes after create/configure/delete; the parent
// keeps `media` and flows it back down the input. The add-subtitle merge bubbles up immutably via
// mediaChange; create/configure/delete success signals updated. Route-scoped DialogService /
// ConfirmActionService / QueueUploadService resolve up the shared dialog injector tree — never
// re-provided here. The shared <p-confirmDialog key="inModal"> element stays in the parent.
@Component({
  selector: 'app-configure-media-episodes',
  templateUrl: './configure-media-episodes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, TableModule, TooltipModule, LazyLoadImageModule, MenuModule, ThumbhashUrlPipe, ShortDatePipe, TimePipe]
})
export class ConfigureMediaEpisodesComponent implements OnInit {
  MediaPStatus = MediaPStatus;

  media = input.required<MediaDetails>();
  t = input.required<TranslocoTranslateFn>();
  parentDialogRef = input.required<DynamicDialogRef>();
  mediaChange = output<MediaDetails>();
  updated = output<void>();

  loadingEpisodes: boolean = false;
  episodes?: TVEpisode[];
  episodeMenuItems: DataMenuItem<TVEpisode>[] = [];

  constructor(@Inject(DOCUMENT) private document: Document, private ref: ChangeDetectorRef, private renderer: Renderer2,
    private dialogService: DialogService, private confirmAction: ConfirmActionService,
    private mediaService: MediaService, private queueUploadService: QueueUploadService,
    private translocoService: TranslocoService) { }

  ngOnInit(): void {
    this.episodes = this.media().tv.episodes;
  }

  loadEpisodes(showLoading: boolean = true): void {
    const mediaId = this.media()._id;
    showLoading && (this.loadingEpisodes = true);
    this.mediaService.findAllTVEpisodes(mediaId, {
      includeHidden: true,
      includeUnprocessed: true
    }).subscribe(episodes => {
      this.episodes = episodes;
    }).add(() => {
      showLoading && (this.loadingEpisodes = false);
      this.ref.markForCheck();
    });
  }

  showAddSubtitleDialog(file?: File, episode?: TVEpisode): void {
    const media = this.media();
    if (file && file.size > UPLOAD_SUBTITLE_SIZE)
      throw new Error(AppErrorCode.UPLOAD_SUBTITLE_TOO_LARGE);
    const dialogRef = this.dialogService.open(AddSubtitleComponent, {
      data: { media: { ...media }, episode: episode ? { ...episode } : undefined, file: file },
      width: '500px',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm',
      contentStyle: { 'margin-top': '-1.5rem' }
    });
    dialogRef.onClose.pipe(first()).subscribe((subtitles: MediaSubtitle[]) => {
      if (!subtitles) return;
      this.mediaChange.emit({ ...media, movie: { ...media.movie, subtitles } });
    });
    fixNestedDialogFocus(dialogRef, this.parentDialogRef(), this.dialogService, this.renderer, this.document);
  }

  showAddSourceDialog(episode?: TVEpisode): void {
    const media = this.media();
    const dialogRef = this.dialogService.open(AddSourceComponent, {
      data: { media: { ...media }, episode: episode ? { ...episode } : undefined },
      width: '500px',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm',
      contentStyle: { 'margin-top': '-1.5rem' }
    });
    //dialogRef.onClose.pipe(first()).subscribe() => {
    //});
    fixNestedDialogFocus(dialogRef, this.parentDialogRef(), this.dialogService, this.renderer, this.document);
  }

  showCreateEpisodeDialog(): void {
    if (!this.episodes) return;
    const dialogRef = this.dialogService.open(CreateEpisodeComponent, {
      data: { media: { ...this.media() }, episodes: [...this.episodes] },
      width: '980px',
      height: '100%',
      modal: true,
      dismissableMask: false,
      styleClass: 'p-dialog-header-sm',
      contentStyle: { 'margin-top': '-1.5rem', 'overflow-y': 'hidden', 'padding': '0px' }
    });
    dialogRef.onClose.pipe(first()).subscribe((episode) => {
      if (!episode || !this.episodes) return;
      this.episodes.push(episode);
      this.updated.emit();
      this.ref.markForCheck();
    });
    fixNestedDialogFocus(dialogRef, this.parentDialogRef(), this.dialogService, this.renderer, this.document);
  }

  showConfigureEpisodeDialog(episode: TVEpisode): void {
    const dialogRef = this.dialogService.open(ConfigureEpisodeComponent, {
      data: { media: { ...this.media() }, episode: { ...episode } },
      width: '1280px',
      height: '100%',
      modal: true,
      showHeader: false,
      dismissableMask: false,
      contentStyle: { 'padding': 0, 'overflow-y': 'hidden' },
      styleClass: '!tw-max-h-full',
      maskStyleClass: 'tw-z-[110]',
      autoZIndex: false
    });
    dialogRef.onClose.pipe(first()).subscribe((updated) => {
      if (!updated) return;
      this.loadEpisodes(true);
    });
    fixNestedDialogFocus(dialogRef, this.parentDialogRef(), this.dialogService, this.renderer, this.document);
  }

  showDeleteEpisodeDialog(episode: TVEpisode): void {
    this.confirmAction.confirmDelete({
      key: 'inModal',
      message: this.translocoService.translate('admin.media.deleteEpisodeConfirmation', { episodeNumber: episode.epNumber }),
      header: this.translocoService.translate('admin.media.deleteEpisodeConfirmationHeader'),
      accept: () => this.deleteEpisode(episode)
    });
  }

  deleteEpisode(episode: TVEpisode): void {
    const mediaId = this.media()._id;
    this.loadingEpisodes = true;
    this.ref.markForCheck();
    this.mediaService.deleteTVEpisode(mediaId, episode._id).subscribe({
      next: () => this.loadEpisodes(true)
    }).add(() => this.ref.markForCheck());
  }

  toggleEpisodeMenu(menu: Menu, event: Event, episode: TVEpisode): void {
    if (!menu.visible) {
      this.createEpisodeMenuItem(episode).subscribe({
        next: (menuItems) => {
          this.episodeMenuItems = menuItems;
          menu.toggle(event);
        }
      });
      return;
    }
    menu.toggle(event);
  }

  createEpisodeMenuItem(episode: TVEpisode): Observable<DataMenuItem<TVEpisode>[]> {
    const mediaId = this.media()._id;
    return this.translocoService.selectTranslation('admin').pipe(first(), map(t => {
      const menuItems: DataMenuItem<TVEpisode>[] = [];
      menuItems.push(
        {
          label: t['configureMedia.addSubtitle'],
          data: episode,
          command: (event) => this.showAddSubtitleDialog(undefined, (<DataMenuItem<TVEpisode | undefined>>event.item)?.data)
        },
        {
          label: t['configureMedia.addSource'],
          data: episode,
          disabled: episode.status !== MediaSourceStatus.PENDING || this.queueUploadService.isMediaInQueue(`${mediaId}:${episode._id}`),
          command: (event) => this.showAddSourceDialog((<DataMenuItem<TVEpisode | undefined>>event.item)?.data)
        },
        { separator: true },
        {
          label: t['configureMedia.deleteEpisode'],
          icon: 'ms ms-delete',
          data: episode,
          command: (event) => {
            if ((<DataMenuItem<TVEpisode | undefined>>event.item)?.data)
              this.showDeleteEpisodeDialog((<DataMenuItem<TVEpisode>>event.item).data!)
          }
        }
      );
      return menuItems;
    }), first());
  }

  trackId(index: number, item: any): any {
    return item?._id;
  }
}
