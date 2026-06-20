import { Component, OnInit, ChangeDetectionStrategy, Input, Renderer2, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoService, TRANSLOCO_SCOPE, TranslocoDirective } from '@jsverse/transloco';
import { DialogService } from 'primeng/dynamicdialog';

import { Media } from '../../../core/models';
import { AuthService, WatchProgressService } from '../../../core/services';
import { MediaType } from '../../../core/enums';
import { AddToPlaylistComponent } from '../../dialogs/add-to-playlist';
import { track_Id } from '../../../core/utils';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { NgTemplateOutlet, DecimalPipe } from '@angular/common';
import { AppOverlayOrigin, AppConnectedOverlay } from '../../directives/overlay-panel/overlay-panel/overlay-panel.directive';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ButtonModule } from 'primeng/button';
import { MenuTriggerDirective } from '../../directives/cdk-menu-custom/menu-trigger/menu-trigger.directive';
import { MenuDirective } from '../../directives/cdk-menu-custom/menu/menu.directive';
import { MenuItemDirective } from '../../directives/cdk-menu-custom/menu-item/menu-item.directive';
import { ShortDatePipe } from '../../pipes/date-time-pipe/short-date/short-date.pipe';
import { TimePipe } from '../../pipes/date-time-pipe/time/time.pipe';
import { ThumbhashUrlPipe } from '../../pipes/placeholder-pipe/thumbhash-url/thumbhash-url.pipe';
import { ProgressBarModule } from 'primeng/progressbar';
import { StripAriaLevelDirective } from '../../directives/strip-aria-level/strip-aria-level.directive';

@Component({
    selector: 'app-media-list',
    templateUrl: './media-list.component.html',
    styleUrls: ['./media-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        DialogService,
        {
            provide: TRANSLOCO_SCOPE,
            useValue: 'media'
        }
    ],
    imports: [TranslocoDirective, SkeletonComponent, NgTemplateOutlet, RouterLink, AppOverlayOrigin, LazyLoadImageModule, ButtonModule, MenuTriggerDirective, AppConnectedOverlay, MenuDirective, MenuItemDirective, DecimalPipe, ShortDatePipe, TimePipe, ThumbhashUrlPipe, ProgressBarModule, StripAriaLevelDirective]
})
export class MediaListComponent implements OnInit, OnDestroy {
  track_Id = track_Id;
  MediaType = MediaType;
  @Input() loading: boolean = false;
  @Input() loadingMore: boolean = false;
  @Input() mediaList?: Media[];
  @Input() itemLimit: number = 30;
  @Input() viewMode: number = 1;
  skeletonArray: Array<any>;

  constructor(private renderer: Renderer2, private dialogService: DialogService, private translocoService: TranslocoService,
    private authService: AuthService, private router: Router, private watchProgress: WatchProgressService) {
    this.skeletonArray = new Array(this.itemLimit);
  }

  // Resume percent for a poster, or null (no overlay) when none / anonymous.
  // Reads a signal-backed map, so the OnPush template re-renders when progress lands.
  progressFor(mediaId: string): number | null {
    return this.watchProgress.progressFor(mediaId);
  }

  ngOnInit(): void {
  }

  onMediaMenuClick(button: HTMLButtonElement, opened: boolean): void {
    this.renderer[opened ? 'removeClass' : 'addClass'](button, 'tw-invisible');
    this.renderer[opened ? 'addClass' : 'removeClass'](button, 'tw-visible');
  }

  showAddToPlaylistDialog(media: Media) {
    if (!this.authService.currentUser) {
      this.router.navigate(['/sign-in']);
      return;
    }
    this.dialogService.open(AddToPlaylistComponent, {
      data: { ...media },
      header: this.translocoService.translate('media.playlists.addToPlaylists'),
      width: '320px',
      modal: true,
      closable: true,
      dismissableMask: true,
      styleClass: 'p-dialog-header-sm'
    });
  }

  ngOnDestroy(): void {
    this.dialogService.dialogComponentRefMap.forEach(dialogRef => {
      dialogRef.instance.close();
    });
  }
}
