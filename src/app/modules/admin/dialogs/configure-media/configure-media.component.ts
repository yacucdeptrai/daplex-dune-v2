import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, AfterViewInit } from '@angular/core';

import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoService, TRANSLOCO_SCOPE, TranslocoDirective } from '@jsverse/transloco';
import { MenuItem, SharedModule } from 'primeng/api';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { first, map, merge, switchMap, takeUntil, tap } from 'rxjs';

import { MediaDetails, MediaVideo, MediaSubtitle } from '../../../../core/models';
import { DestroyService, ItemDataService, MediaService } from '../../../../core/services';
import { WsService } from '../../../../shared/modules/ws';
import { MediaChange, MediaVideoChange } from '../../../../core/interfaces/ws';
import { ExtStreamSelected } from '../../../../core/interfaces/events';
import { replaceDialogHideMethod } from '../../../../core/utils';
import { MediaSourceStatus, MediaType, SocketMessage, SocketRoom } from '../../../../core/enums';
import { ButtonModule } from 'primeng/button';
import { NgTemplateOutlet } from '@angular/common';
import { VerticalTabComponent } from '../../../../shared/components/vertical-tab/vertical-tab.component';
import { TabPanelDirective } from '../../../../shared/components/vertical-tab/tab-panel.directive';
import { InputSwitchModule } from 'primeng/inputswitch';
import { PanelToastDirective } from '../../../../shared/components/vertical-tab/panel-toast.directive';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfigureMediaImagesComponent } from './components/configure-media-images';
import { ConfigureMediaVideosComponent } from './components/configure-media-videos';
import { ConfigureMediaSubtitlesComponent } from './components/configure-media-subtitles';
import { ConfigureMediaSourceComponent } from './components/configure-media-source';
import { ConfigureMediaEpisodesComponent } from './components/configure-media-episodes';
import { ConfigureMediaFormComponent } from './components/configure-media-form';

@Component({
    selector: 'app-configure-media',
    templateUrl: './configure-media.component.html',
    styleUrls: ['./configure-media.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ItemDataService,
        DestroyService,
        {
            provide: TRANSLOCO_SCOPE,
            useValue: ['common', 'languages']
        }
    ],
    imports: [TranslocoDirective, ButtonModule, VerticalTabComponent, TabPanelDirective, ReactiveFormsModule, SharedModule, InputSwitchModule, PanelToastDirective, NgTemplateOutlet, ConfirmDialogModule, ProgressSpinnerModule, ConfigureMediaImagesComponent, ConfigureMediaVideosComponent, ConfigureMediaSubtitlesComponent, ConfigureMediaSourceComponent, ConfigureMediaEpisodesComponent, ConfigureMediaFormComponent]
})
export class ConfigureMediaComponent implements OnInit, AfterViewInit, OnDestroy {
  MediaType = MediaType;
  MediaSourceStatus = MediaSourceStatus;
  loadingMedia: boolean = false;
  isUpdated: boolean = false;
  media?: MediaDetails;
  sideBarItems: MenuItem[] = [];

  constructor(private ref: ChangeDetectorRef,
    protected dialogRef: DynamicDialogRef, private config: DynamicDialogConfig<MediaDetails>, private dialogService: DialogService,
    private mediaService: MediaService,
    private wsService: WsService, private translocoService: TranslocoService, private destroyService: DestroyService) { }

  ngOnInit(): void {
    this.loadMedia();
    this.loadTranslations();
    this.initSocket();
  }

  initSocket(): void {
    const mediaId = this.config.data!._id;
    const connect$ = this.wsService.fromEvent('connect').pipe(tap(() => {
      this.wsService.joinRoom(`${SocketRoom.ADMIN_MEDIA_DETAILS}:${mediaId}`);
    }));
    const refreshMedia$ = this.wsService.fromEvent<MediaChange>(SocketMessage.REFRESH_MEDIA).pipe(tap(() => this.loadMedia(false)));
    const refreshMediaVideos$ = this.wsService.fromEvent<MediaVideoChange>(SocketMessage.REFRESH_MEDIA_VIDEOS)
      .pipe(tap(data => this.updateMediaVideos(data.videos)));
    const refreshMovieSubtitles$ = this.wsService.fromEvent<MediaVideoChange>(SocketMessage.REFRESH_MOVIE_SUBTITLES)
      .pipe(tap(data => this.updateMediaVideos(data.videos)));
    const mediaProcessingSuccess$ = this.wsService.fromEvent<MediaChange>(SocketMessage.MEDIA_PROCESSING_SUCCESS)
      .pipe(tap(() => this.updateMovieSourceStatus(MediaSourceStatus.DONE)));
    const mediaProcessingFailure$ = this.wsService.fromEvent<MediaChange>(SocketMessage.MEDIA_PROCESSING_FAILURE)
      .pipe(tap(() => this.updateMovieSourceStatus(MediaSourceStatus.PENDING)));
    const deleteMovieSource$ = this.wsService.fromEvent<MediaChange>(SocketMessage.DELETE_MOVIE_SOURCE)
      .pipe(tap(() => this.updateMovieSourceStatus(MediaSourceStatus.PENDING)));
    merge(connect$, refreshMedia$, refreshMediaVideos$, refreshMovieSubtitles$, mediaProcessingSuccess$,
      mediaProcessingFailure$, deleteMovieSource$)
      .pipe(takeUntil(this.destroyService)).subscribe();
  }

  ngAfterViewInit(): void {
    replaceDialogHideMethod(this.dialogService, () => {
      this.closeDialog();
    }, this.dialogRef);
  }

  updateMovieSourceStatus(status: MediaSourceStatus): void {
    if (!this.media) return;
    this.media = { ...this.media, movie: { ...this.media.movie, status } };
    this.ref.markForCheck();
  }

  updateMediaVideos(videos: MediaVideo[]): void {
    if (!this.media) return;
    this.media = { ...this.media, videos };
    this.ref.markForCheck();
  }

  updateMediaSubtitles(subtitles: MediaSubtitle[]): void {
    if (!this.media) return;
    this.media = { ...this.media, movie: { ...this.media.movie, subtitles } };
    this.ref.markForCheck();
  }

  onImagesMediaChange(media: MediaDetails): void {
    this.media = media;
    this.ref.markForCheck();
  }

  onVideosMediaChange(media: MediaDetails): void {
    this.media = media;
    this.ref.markForCheck();
  }

  onSubtitlesMediaChange(media: MediaDetails): void {
    this.media = media;
    this.ref.markForCheck();
  }

  onSourceMediaChange(media: MediaDetails): void {
    this.media = media;
    this.ref.markForCheck();
  }

  onEpisodesMediaChange(media: MediaDetails): void {
    this.media = media;
    this.ref.markForCheck();
  }

  onFormMediaChange(media: MediaDetails): void {
    this.media = media;
    this.ref.markForCheck();
  }

  loadMedia(showLoading: boolean = true): void {
    if (!this.config.data) return;
    const mediaId = this.config.data!._id;
    showLoading && (this.loadingMedia = true);
    this.mediaService.findOne(mediaId, { includeHiddenEps: true, includeUnprocessedEps: true }).subscribe(media => {
      this.media = media;
    }).add(() => {
      showLoading && (this.loadingMedia = false);
      this.ref.markForCheck();
    });
  }

  updateExtStreams(event: ExtStreamSelected): void {
    const mediaId = this.config.data!._id;
    this.mediaService.update(mediaId, { extStreams: event.streams }).subscribe({
      next: () => event.next(),
      error: () => event.error()
    });
  }

  loadTranslations(): void {
    this.translocoService.selectTranslation('media').pipe(first(), switchMap(t2 => {
      return this.translocoService.selectTranslation('admin').pipe(first(), map(t1 => ({ t1, t2 })));
    }), first()).subscribe(({ t1, t2 }) => {
      this.sideBarItems = [
        {
          label: t1['configureMedia.general']
        },
        {
          label: t1['configureMedia.images']
        },
        {
          label: t2['details.videos']
        },
        {
          label: t1['configureMedia.subtitles']
        },
        {
          label: t1['configureMedia.source']
        }
      ];
    });
  }

  closeDialog(): void {
    this.dialogRef.close(this.isUpdated);
  }

  ngOnDestroy(): void {
    const mediaId = this.config.data!._id;
    this.wsService.leaveRoom(`${SocketRoom.ADMIN_MEDIA_DETAILS}:${mediaId}`);
  }

}
