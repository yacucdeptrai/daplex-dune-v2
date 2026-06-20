import { Component, OnInit, ChangeDetectionStrategy, Renderer2, OnDestroy, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoService, TranslocoTranslateFn } from '@jsverse/transloco';
import { DialogService } from 'primeng/dynamicdialog';

import { Media } from '../../../../core/models';
import { AuthService } from '../../../../core/services';
import { MediaType } from '../../../../core/enums';
import { AddToPlaylistComponent } from '../../../../shared/dialogs/add-to-playlist';
import { NgLetDirective } from '../../../../shared/directives/common-directive/ng-let/ng-let.directive';
import { AppOverlayOrigin, AppConnectedOverlay } from '../../../../shared/directives/overlay-panel/overlay-panel/overlay-panel.directive';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ButtonModule } from 'primeng/button';
import { DecimalPipe } from '@angular/common';
import { ShortDatePipe } from '../../../../shared/pipes/date-time-pipe/short-date/short-date.pipe';
import { ThumbhashUrlPipe } from '../../../../shared/pipes/placeholder-pipe/thumbhash-url/thumbhash-url.pipe';

@Component({
    selector: 'app-collection-media-list',
    templateUrl: './collection-media-list.component.html',
    styleUrl: './collection-media-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgLetDirective, AppOverlayOrigin, RouterLink, LazyLoadImageModule, AppConnectedOverlay, ButtonModule, DecimalPipe, ShortDatePipe, ThumbhashUrlPipe]
})
export class CollectionMediaListComponent implements OnInit, OnDestroy {
  MediaType = MediaType;
  t = input.required<TranslocoTranslateFn>();
  mediaList = input<Media[] | undefined>();

  constructor(private renderer: Renderer2, private dialogService: DialogService, private translocoService: TranslocoService,
    private authService: AuthService, private router: Router) { }

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
