import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, Renderer2, Inject, OnDestroy, DOCUMENT } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService, TranslocoDirective } from '@jsverse/transloco';
import { DialogService } from 'primeng/dynamicdialog';
import { Table, TableModule } from 'primeng/table';
import { Menu, MenuModule } from 'primeng/menu';
import { first, map, merge, Observable, of, takeUntil, tap } from 'rxjs';

import { ConfirmActionService, DestroyService, MediaService, QueueUploadService } from '../../../../core/services';
import { WsService } from '../../../../shared/modules/ws';
import { Media, MediaDetails, Paginated } from '../../../../core/models';
import { OffsetPageMediaDto } from '../../../../core/dto/media';
import { DataMenuItem } from '../../../../core/interfaces/primeng';
import { MediaChange } from '../../../../core/interfaces/ws';
import { CreateMediaComponent } from '../../dialogs/create-media';
import { ConfigureMediaComponent } from '../../dialogs/configure-media';
import { MediaPStatus, MediaSourceStatus, MediaType, SocketMessage, SocketRoom, ToastKey } from '../../../../core/enums';
import { AddVideoComponent } from '../../dialogs/add-video';
import { AddSubtitleComponent } from '../../dialogs/add-subtitle';
import { AddSourceComponent } from '../../dialogs/add-source';
import { buildTablePaginationParams, translocoEscape } from '../../../../core/utils';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageService, SharedModule } from 'primeng/api';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ShortDatePipe } from '../../../../shared/pipes/date-time-pipe/short-date/short-date.pipe';
import { TimePipe } from '../../../../shared/pipes/date-time-pipe/time/time.pipe';
import { ThumbhashUrlPipe } from '../../../../shared/pipes/placeholder-pipe/thumbhash-url/thumbhash-url.pipe';

@Component({
    selector: 'app-media',
    templateUrl: './media.component.html',
    styleUrls: ['./media.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DestroyService],
    imports: [TranslocoDirective, InputTextModule, ButtonModule, TableModule, SharedModule, LazyLoadImageModule, TooltipModule, ConfirmDialogModule, MenuModule, ShortDatePipe, TimePipe, ThumbhashUrlPipe]
})
export class MediaComponent implements OnInit, OnDestroy {
  MediaType = MediaType;
  MediaPStatus = MediaPStatus;

  @ViewChild('mediaTable') mediaTable?: Table;
  loadingMediaList: boolean = false;
  rowsPerPage: number = 10;
  mediaList?: Paginated<Media>;
  cachedMediaDetails?: MediaDetails;
  mediaMenuItems: DataMenuItem<Media>[] = [];

  constructor(@Inject(DOCUMENT) private document: Document, private ref: ChangeDetectorRef, private renderer: Renderer2,
    private route: ActivatedRoute, private router: Router, public dialogService: DialogService,
    private confirmAction: ConfirmActionService, private mediaService: MediaService,
    private queueUploadService: QueueUploadService, private wsService: WsService,
    private translocoService: TranslocoService, private messageService: MessageService,
    private destroyService: DestroyService) { }

  ngOnInit(): void {
    this.initSocket();
  }

  initSocket(): void {
    const connect$ = this.wsService.fromEvent('connect').pipe(tap(() => {
      this.wsService.joinRoom(SocketRoom.ADMIN_MEDIA_LIST);
    }));
    const refreshMedia$ = this.wsService.fromEvent<MediaChange>(SocketMessage.REFRESH_MEDIA).pipe(tap(data => {
      if (!data) return this.loadMedia(false);
      if (!this.mediaList) return;
      const mediaIndex = this.mediaList.results.findIndex(m => m._id === data.mediaId);
      if (mediaIndex === -1) return;
      this.loadMedia(false);
    }));
    const saveMovieSource$ = this.wsService.fromEvent<MediaChange>(SocketMessage.SAVE_MOVIE_SOURCE)
      .pipe(tap(data => this.updateMediaStatus(data.mediaId, MediaPStatus.PROCESSING)));
    const addMovieStream$ = this.wsService.fromEvent<MediaChange>(SocketMessage.ADD_MOVIE_STREAM)
      .pipe(tap(data => this.updateMediaStatus(data.mediaId, MediaPStatus.DONE)));
    const saveTVSource$ = this.wsService.fromEvent<MediaChange>(SocketMessage.SAVE_TV_SOURCE)
      .pipe(tap(data => this.updateMediaStatus(data.mediaId, MediaPStatus.PROCESSING)));
    const addTVStream$ = this.wsService.fromEvent<MediaChange>(SocketMessage.ADD_TV_STREAM)
      .pipe(tap(data => this.updateMediaStatus(data.mediaId, MediaPStatus.DONE)));
    merge(connect$, refreshMedia$, saveMovieSource$, addMovieStream$, saveTVSource$, addTVStream$)
      .pipe(takeUntil(this.destroyService)).subscribe();
  }

  updateMediaStatus(id: string, pStatus: MediaPStatus): void {
    if (!this.mediaList) return;
    const mediaIndex = this.mediaList.results.findIndex(m => m._id === id);
    if (mediaIndex === -1) return;
    this.mediaList.results[mediaIndex].pStatus = pStatus;
    this.ref.markForCheck();
  }

  loadMedia(showLoading: boolean = true): void {
    const params: OffsetPageMediaDto = {
      includeHidden: true,
      includeUnprocessed: true,
      ...buildTablePaginationParams(this.mediaTable, {
        rowsPerPage: this.rowsPerPage, searchField: 'title', minSearchLength: 2
      })
    };
    showLoading && (this.loadingMediaList = true);
    this.mediaService.findPage(params).subscribe({
      next: (mediaList) => {
        this.mediaList = mediaList;
        this.ref.markForCheck();
      }
    }).add(() => {
      showLoading && (this.loadingMediaList = false);
    });
  }

  findMediaDetails(mediaId: string) {
    if (this.cachedMediaDetails?._id === mediaId)
      return of(this.cachedMediaDetails);
    return this.mediaService.findOne(mediaId).pipe(tap(media => this.cachedMediaDetails = media));
  }

  showCreateMediaDialog(type: string): void {
    const dialogRef = this.dialogService.open(CreateMediaComponent, {
      data: { type },
      width: '1024px',
      height: '100%',
      modal: true,
      styleClass: 'p-dialog-header-sm',
      contentStyle: { 'margin-top': '-1.5rem', 'overflow-y': 'hidden', 'padding': '0' },
      dismissableMask: false
    });
    dialogRef.onClose.pipe(first()).subscribe((result: boolean) => {
      if (!result) return;
      this.loadMedia();
    });
  }

  showConfigureMediaDialog(media: Media): void {
    const dialogRef = this.dialogService.open(ConfigureMediaComponent, {
      data: { ...media },
      width: '100%',
      height: '100%',
      modal: true,
      showHeader: false,
      contentStyle: { 'overflow-y': 'hidden', 'padding': '0' },
      styleClass: '!tw-max-h-full',
      maskStyleClass: 'tw-z-[100]',
      autoZIndex: false
    });
    dialogRef.onClose.pipe(first()).subscribe((isUpdated: boolean) => {
      if (!isUpdated) return;
      this.loadMedia();
    });
  }

  showAddMediaVideoDialog(media: Media): void {
    this.findMediaDetails(media._id).pipe(tap(mediaDetails => {
      this.dialogService.open(AddVideoComponent, {
        data: { ...mediaDetails },
        width: '700px',
        modal: true,
        dismissableMask: true,
        styleClass: 'p-dialog-header-sm',
        contentStyle: { 'margin-top': '-1.5rem' }
      });
    })).subscribe();
  }

  showAddSubtitleDialog(media: Media): void {
    this.findMediaDetails(media._id).pipe(tap(mediaDetails => {
      this.dialogService.open(AddSubtitleComponent, {
        data: { media: { ...mediaDetails } },
        width: '500px',
        modal: true,
        dismissableMask: true,
        styleClass: 'p-dialog-header-sm',
        contentStyle: { 'margin-top': '-1.5rem' }
      });
    })).subscribe();
  }

  showAddSourceDialog(media: Media): void {
    this.findMediaDetails(media._id).pipe(tap(mediaDetails => {
      this.dialogService.open(AddSourceComponent, {
        data: { media: { ...mediaDetails } },
        width: '500px',
        modal: true,
        dismissableMask: true,
        styleClass: 'p-dialog-header-sm',
        contentStyle: { 'margin-top': '-1.5rem' }
      });
    })).subscribe();
  }

  showDeleteMediaDialog(media: Media): void {
    const safeMediaTitle = translocoEscape(media.title).replace(/{/g, '&#123;').replace(/}/g, '&#125;');
    this.confirmAction.confirmDelete({
      key: 'default',
      message: this.translocoService.translate('admin.media.deleteConfirmation', { name: safeMediaTitle }),
      header: this.translocoService.translate('admin.media.deleteConfirmationHeader'),
      accept: () => this.removeMedia(media._id)
    });
  }

  removeMedia(id: string): void {
    this.loadingMediaList = true;
    this.mediaService.remove(id).subscribe({
      error: () => this.messageService.add({
        key: ToastKey.APP,
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete media',
        life: 10000
      })
    }).add(() => {
      this.loadMedia();
    });
  }

  uploadPoster(media: Media, event: Event) {
    const element = <HTMLInputElement>event.target;
    if (!element.files?.length) return;
    this.renderer.setProperty(element, 'disabled', true);
    this.mediaService.uploadPoster(media._id, element.files[0]).subscribe({
      next: () => this.loadMedia()
    }).add(() => {
      if (this.document.body.contains(element)) {
        this.renderer.setProperty(element, 'disabled', false);
      }
    });
  }

  deletePoster(media: Media, event: Event) {
    const safeMediaTitle = translocoEscape(media.title);
    this.confirmAction.confirmDelete({
      key: 'default',
      message: this.translocoService.translate('admin.media.deletePosterConfirmation', { name: safeMediaTitle }),
      header: this.translocoService.translate('admin.media.deletePosterConfirmationHeader'),
      accept: () => {
        const element = <HTMLButtonElement>event.target;
        this.renderer.setProperty(element, 'disabled', true);
        this.mediaService.deletePoster(media._id).subscribe().add(() => {
          this.renderer.setProperty(element, 'disabled', false);
          this.loadMedia();
        });
      }
    });
  }

  uploadBackdrop(media: Media, event: Event) {
    const element = <HTMLInputElement>event.target;
    if (!element.files?.length) return;
    this.renderer.setProperty(element, 'disabled', true);
    this.mediaService.uploadBackdrop(media._id, element.files[0]).subscribe({
      next: () => this.loadMedia()
    }).add(() => {
      if (this.document.body.contains(element)) {
        this.renderer.setProperty(element, 'disabled', false);
      }
    });
  }

  deleteBackdrop(media: Media, event: Event) {
    const safeMediaTitle = translocoEscape(media.title);
    this.confirmAction.confirmDelete({
      key: 'default',
      message: this.translocoService.translate('admin.media.deleteBackdropConfirmation', { name: safeMediaTitle }),
      header: this.translocoService.translate('admin.media.deleteBackdropConfirmationHeader'),
      accept: () => {
        const element = <HTMLButtonElement>event.target;
        this.renderer.setProperty(element, 'disabled', true);
        this.mediaService.deleteBackdrop(media._id).subscribe().add(() => {
          this.renderer.setProperty(element, 'disabled', false);
          this.loadMedia();
        });
      }
    });
  }

  toggleMediaMenu(menu: Menu, event: Event, media: Media): void {
    if (!menu.visible) {
      this.createMediaMenuItem(media).subscribe({
        next: (menuItems) => {
          this.mediaMenuItems = menuItems;
          menu.toggle(event);
        }
      });
      return;
    }
    menu.toggle(event);
  }

  createMediaMenuItem(media: Media): Observable<DataMenuItem<Media>[]> {
    return this.translocoService.selectTranslation('admin').pipe(first(), map(t => {
      const menuItems: DataMenuItem<Media>[] = [];
      menuItems.push({
        label: t['configureMedia.addVideo'],
        data: media,
        command: (event) => this.showAddMediaVideoDialog((<DataMenuItem<Media>>event.item)!.data!)
      });
      if (media.type === MediaType.MOVIE) {
        // Movie menu
        menuItems.push(
          {
            label: t['configureMedia.addSubtitle'],
            data: media,
            command: (event) => this.showAddSubtitleDialog((<DataMenuItem<Media>>event.item)!.data!)
          },
          {
            label: t['configureMedia.addSource'],
            data: media,
            disabled: media.movie.status !== MediaSourceStatus.PENDING || this.queueUploadService.isMediaInQueue(media._id),
            command: (event) => this.showAddSourceDialog((<DataMenuItem<Media>>event.item)!.data!)
          }
        );
      } else {
        // TV Menu
        menuItems.push(
          {
            label: t['configureMedia.addEpisode'],
            data: media,
            command: (event) => this.showConfigureMediaDialog((<DataMenuItem<Media>>event.item)!.data!)
          }
        );
      }
      menuItems.push(
        { separator: true },
        {
          label: t['configureMedia.deleteMedia'],
          icon: 'ms ms-delete',
          data: media,
          disabled: media.pStatus === MediaPStatus.PROCESSING,
          command: (event) => this.showDeleteMediaDialog((<DataMenuItem<Media>>event.item)!.data!)
        }
      );
      return menuItems;
    }), first());
  }

  onPage() {
    this.mediaTable?.el.nativeElement.scrollIntoView();
  }

  trackId(index: number, item: any): any {
    return item?._id;
  }

  ngOnDestroy(): void {
    this.wsService.leaveRoom(SocketRoom.ADMIN_MEDIA_LIST);
    this.dialogService.dialogComponentRefMap.forEach(dialogRef => {
      dialogRef.instance.close();
    });
  }

}
