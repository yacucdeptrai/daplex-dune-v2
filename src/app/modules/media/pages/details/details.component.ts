import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DialogService } from 'primeng/dynamicdialog';
import { TranslocoService } from '@ngneat/transloco';
import { takeUntil } from 'rxjs';

import { AddToPlaylistComponent } from '../../../../shared/dialogs/add-to-playlist';
import { MediaDetails } from '../../../../core/models';
import { AuthService, MediaMetaService, MediaService } from '../../../../core/services';
import { DestroyService } from '../../../../core/services';
import { MediaBreakpoints, MediaStatus, MediaType } from '../../../../core/enums';
import { TextResizeOption } from '../../../../shared/directives/text-directive/text-resize/text-resize.directive';
import { SITE_NAME, YOUTUBE_EMBED_URL, YOUTUBE_THUMBNAIL_URL } from '../../../../../environments/config';
import { track_Id } from '../../../../core/utils';

@Component({
    selector: 'app-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DestroyService],
    standalone: false
})
export class DetailsComponent implements OnInit, OnDestroy {
  track_Id = track_Id;
  MediaType = MediaType;
  MediaStatus = MediaStatus;
  media?: MediaDetails;
  isMobile: boolean = false;
  displayVideo: boolean = false;
  activeVideoIndex: number = 0;
  titleResizes: TextResizeOption[] = [];
  originalTitleResizes: TextResizeOption[] = [];
  youtubeUrl = YOUTUBE_EMBED_URL;
  youtubeThumbnailUrl = YOUTUBE_THUMBNAIL_URL;

  constructor(private ref: ChangeDetectorRef, private title: Title, private mediaMeta: MediaMetaService, private breakpointObserver: BreakpointObserver,
    private location: Location, private dialogService: DialogService, private translocoService: TranslocoService,
    private authService: AuthService, private mediaService: MediaService, private route: ActivatedRoute, private router: Router,
    private destroyService: DestroyService) { }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroyService)).subscribe(params => {
      const id = params['id'];
      if (!id) return;
      this.loadMedia(id);
    });
    this.breakpointObserver.observe(MediaBreakpoints.SMALL).pipe(takeUntil(this.destroyService)).subscribe(state => {
      this.isMobile = !state.matches;
      this.updateTitleResizeOptions();
      this.ref.markForCheck();
    });
  }

  loadMedia(id: string) {
    const mediaId = id.split('-')[0];
    this.mediaService.findOne(mediaId, { appendToResponse: 'inCollections' }).subscribe(media => {
      this.media = media;
      this.title.setTitle(`${media.title} - ${SITE_NAME}`);
      this.mediaMeta.setMediaMeta(media);
      const replacedUrlParams = new URLSearchParams({ ...this.route.snapshot.queryParams }).toString();
      this.location.replaceState('/details/' + media._id + '-' + media.slug.substring(0, 100), replacedUrlParams);
      this.ref.markForCheck();
    });
  }

  viewVideo(index: number) {
    this.activeVideoIndex = index;
    this.displayVideo = true;
  }

  showAddToPlaylistDialog() {
    if (!this.media) return;
    if (!this.authService.currentUser) {
      this.router.navigate(['/sign-in'], { queryParams: { continue: `/details/${this.media._id}` } });
      return;
    }
    this.dialogService.open(AddToPlaylistComponent, {
      data: { ...this.media },
      header: this.translocoService.translate('media.playlists.addToPlaylists'),
      width: '320px',
      modal: true,
      dismissableMask: true,
      styleClass: 'p-dialog-header-sm'
    });
  }

  updateTitleResizeOptions() {
    if (!this.isMobile) {
      this.titleResizes = [
        { length: 50, size: '28px', lineHeight: '32px' },
        { length: 75, size: '24px', lineHeight: '28px' },
        { length: 100, size: '18px', lineHeight: '22px' }
      ];
      this.originalTitleResizes = [
        { length: 75, size: '20px', lineHeight: '24px' },
        { length: 100, size: '16px', lineHeight: '20px' }
      ];
    } else {
      this.titleResizes = [
        { length: 50, size: '18px', lineHeight: '22px' },
        { length: 75, size: '14px', lineHeight: '18px' },
        { length: 100, size: '12px', lineHeight: '16px' }
      ];
      this.originalTitleResizes = [
        { length: 50, size: '16px', lineHeight: '20px' },
        { length: 75, size: '12px', lineHeight: '16px' }
      ];
    }
  }

  ngOnDestroy(): void {
    this.mediaMeta.resetMediaMeta();
    this.dialogService.dialogComponentRefMap.forEach(dialogRef => {
      dialogRef.instance.close();
    });
  }
}
