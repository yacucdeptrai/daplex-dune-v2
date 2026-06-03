import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoService, TranslocoDirective } from '@ngneat/transloco';
import { DialogService } from 'primeng/dynamicdialog';
import { takeUntil } from 'rxjs';

import { CursorPaginated, Media, RatingDetails, UserDetails } from '../../../../core/models';
import { AuthService, ConfirmActionService, DestroyService, RatingsService } from '../../../../core/services';
import { StarRatingComponent } from '../../../../shared/components/star-rating';
import { AddToPlaylistComponent } from '../../../../shared/dialogs/add-to-playlist';
import { track_Id, translocoEscape } from '../../../../core/utils';
import { NgIf, NgFor } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AppOverlayOrigin, AppConnectedOverlay } from '../../../../shared/directives/overlay-panel/overlay-panel/overlay-panel.directive';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { RatingCardComponent } from '../../components/rating-card/rating-card.component';
import { TableModule } from 'primeng/table';
import { SharedModule } from 'primeng/api';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { StarRatingComponent as StarRatingComponent_1 } from '../../../../shared/components/star-rating/star-rating.component';
import { MenuTriggerDirective } from '../../../../shared/directives/cdk-menu-custom/menu-trigger/menu-trigger.directive';
import { MenuDirective } from '../../../../shared/directives/cdk-menu-custom/menu/menu.directive';
import { MenuItemDirective } from '../../../../shared/directives/cdk-menu-custom/menu-item/menu-item.directive';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DateAltPipe } from '../../../../shared/pipes/date-time-pipe/date-alt/date-alt.pipe';
import { ThumbhashUrlPipe } from '../../../../shared/pipes/placeholder-pipe/thumbhash-url/thumbhash-url.pipe';

@Component({
    selector: 'app-rated',
    templateUrl: './rated.component.html',
    styleUrls: ['./rated.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [RatingsService, DestroyService],
    imports: [TranslocoDirective, NgIf, ButtonModule, AppOverlayOrigin, SelectButtonModule, FormsModule, AppConnectedOverlay, InputSwitchModule, InfiniteScrollDirective, NgFor, RatingCardComponent, TableModule, SharedModule, LazyLoadImageModule, StarRatingComponent_1, RouterLink, MenuTriggerDirective, MenuDirective, MenuItemDirective, ConfirmDialogModule, DateAltPipe, ThumbhashUrlPipe]
})
export class RatedComponent implements OnInit, OnDestroy {
  track_Id = track_Id;
  loadingRatings: boolean = false;
  loadingMoreRatings: boolean = false;
  displaySettings: boolean = false;
  editMode: boolean = false;
  ratingLimit: number = 30;
  skeletonArray: Array<any>;
  currentUser!: UserDetails | null;
  ratingList?: CursorPaginated<RatingDetails>;
  listViewMode: 1 | 2 = 1;
  userId: string | null = null;

  constructor(private ref: ChangeDetectorRef, private renderer: Renderer2, private translocoService: TranslocoService,
    private route: ActivatedRoute, private router: Router, private dialogService: DialogService,
    private confirmAction: ConfirmActionService, private authService: AuthService,
    private ratingsService: RatingsService, private destroyService: DestroyService) {
    this.skeletonArray = new Array(this.ratingLimit);
  }

  ngOnInit(): void {
    this.route.parent?.paramMap.pipe(takeUntil(this.destroyService)).subscribe(params => {
      this.userId = params.get('id');
      this.loadRatings();
    });
    this.authService.currentUser$.pipe(takeUntil(this.destroyService)).subscribe(user => {
      this.currentUser = user;
      this.ref.markForCheck();
    });
  }

  loadRatings(resetList?: boolean, pageToken?: string): void {
    if (resetList)
      this.loadingRatings = true;
    else
      this.loadingMoreRatings = true;
    this.ratingsService.findPage({
      pageToken: pageToken,
      limit: this.ratingLimit,
      sort: 'desc(date)',
      user: this.userId
    }).subscribe(newGroupList => {
      this.appendRatings(newGroupList);
    }).add(() => {
      if (resetList)
        this.loadingRatings = false;
      else
        this.loadingMoreRatings = false;
      this.ref.markForCheck();
    });
  }

  appendRatings(newList: CursorPaginated<RatingDetails>, resetList?: boolean): void {
    if (!this.ratingList || resetList) {
      this.ratingList = newList;
      return;
    }
    this.ratingList = {
      hasNextPage: newList.hasNextPage,
      nextPageToken: newList.nextPageToken,
      prevPageToken: newList.prevPageToken,
      totalResults: newList.totalResults,
      results: [...this.ratingList.results, ...newList.results]
    };
  }

  onScroll(): void {
    if (!this.ratingList || !this.ratingList.hasNextPage) return;
    this.loadRatings(false, this.ratingList.nextPageToken);
  }

  showAddToPlaylistDialog(media: Media): void {
    if (!this.currentUser) {
      this.router.navigate(['/sign-in'], { queryParams: { continue: this.router.url } });
      return;
    }
    this.dialogService.open(AddToPlaylistComponent, {
      data: { ...media },
      header: this.translocoService.translate('media.playlists.addToPlaylists'),
      width: '320px',
      modal: true,
      dismissableMask: true,
      styleClass: 'p-dialog-header-sm'
    });
  }

  onRating(ratingScore: number | null, rating: RatingDetails, starRating: StarRatingComponent) {
    starRating.disabled = true;
    this.ratingsService.create({
      media: rating.media._id,
      score: ratingScore && (ratingScore * 2)
    }).subscribe({
      error: () => {
        starRating.setRating(rating.score / 2);
      }
    }).add(() => {
      starRating.disabled = false;
      starRating.ref.markForCheck();
    });
  }

  showDeleteRatingDialog(rating: RatingDetails): void {
    const safeMediaName = translocoEscape(rating.media.title);
    this.confirmAction.confirmDelete({
      message: this.translocoService.translate('users.rating.deleteConfirmation', { name: safeMediaName }),
      header: this.translocoService.translate('users.rating.deleteConfirmationHeader'),
      accept: () => this.deleteRating(rating)
    });
  }

  deleteRating(rating: RatingDetails): void {
    this.ratingsService.remove(rating._id).subscribe(() => {
      if (!this.ratingList) return;
      const ratingIndex = this.ratingList.results.findIndex(r => r._id === rating._id);
      this.ratingList.results.splice(ratingIndex, 1);
      this.ref.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.dialogService.dialogComponentRefMap.forEach(dialogRef => {
      dialogRef.instance.close();
    });
  }
}
