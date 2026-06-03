import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { withCache } from '@ngneat/cashew';

import { Media, Paginated } from '../../../../core/models';
import { MediaService } from '../../../../core/services';
import { CacheKey } from '../../../../core/enums';
import { catchError, merge, of, tap } from 'rxjs';
import { SITE_NAME } from '../../../../../environments/config';
import { DialogService } from 'primeng/dynamicdialog';
import { TranslocoDirective } from '@ngneat/transloco';
import { FeaturedMediaComponent } from '../../components/featured-media/featured-media.component';
import { MediaListComponent } from '../../../../shared/components/media-list/media-list.component';
import { MediaTopComponent } from '../../../../shared/components/media-top/media-top.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DialogService],
    imports: [TranslocoDirective, FeaturedMediaComponent, MediaListComponent, MediaTopComponent]
})
export class HomeComponent implements OnInit, OnDestroy {
  loadingFeaturedMedia: boolean = false;
  loadingMediaList: boolean = false;
  loadingMediaTop: boolean = false;
  featuredMedia?: Media[];
  newReleaseMedia?: Paginated<Media>;
  lastUpdatedMedia?: Paginated<Media>;
  lastAddedMedia?: Paginated<Media>;
  mostViewedMedia?: Paginated<Media>;
  topRatedMedia?: Paginated<Media>;

  constructor(private ref: ChangeDetectorRef, private meta: Meta, private mediaService: MediaService) { }

  ngOnInit(): void {
    this.setHomeMeta();
    this.loadMedia();
  }

  loadMedia(): void {
    this.loadingFeaturedMedia = true;
    this.loadingMediaList = true;
    this.loadingMediaTop = true;
    this.mediaService.findPage({ limit: 5, sort: 'desc(createdAt)' }, withCache({ key: CacheKey.FEATURED_MEDIA }))
      .pipe(catchError(() => of(null)))
      .subscribe({
        next: data => {
          if (data) this.featuredMedia = data.results;
        }
      }).add(() => {
        this.loadingFeaturedMedia = false;
        this.ref.markForCheck();
      });
    merge(
      this.mediaService.findPage({ limit: 12, sort: 'desc(releaseDate.year,releaseDate.month,releaseDate.day)' },
        withCache({ key: CacheKey.NEW_RELEASE_MEDIA }))
        .pipe(tap(data => {
          this.newReleaseMedia = data;
        }), catchError(() => of(null))),
      this.mediaService.findPage({ limit: 12, sort: 'desc(_id)' }, withCache({ key: CacheKey.LAST_ADDED_MEDIA }))
        .pipe(tap(data => {
          this.lastAddedMedia = data;
        }), catchError(() => of(null))),
      this.mediaService.findPage({ limit: 12, sort: 'desc(updatedAt)' }, withCache({ key: CacheKey.LAST_UPDATED_MEDIA }))
        .pipe(tap(data => {
          this.lastUpdatedMedia = data;
        }), catchError(() => of(null)))
    ).subscribe().add(() => {
      this.loadingMediaList = false;
      this.ref.markForCheck();
    });
    merge(
      this.mediaService.findPage({ limit: 10, sort: 'desc(views)' }, withCache({ key: CacheKey.MOST_VIEWED_MEDIA }))
        .pipe(tap(data => {
          this.mostViewedMedia = data;
        }), catchError(() => of(null))),
      this.mediaService.findPage({ limit: 10, sort: 'desc(ratingAverage)' }, withCache({ key: CacheKey.TOP_RATED_MEDIA }))
        .pipe(tap(data => {
          this.topRatedMedia = data;
        }), catchError(() => of(null)))
    ).subscribe().add(() => {
      this.loadingMediaTop = false;
      this.ref.markForCheck();
    });
  }

  setHomeMeta(): void {
    this.meta.updateTag({ name: 'description', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:title', content: 'Home Page' });
    this.meta.updateTag({ property: 'og:description', content: 'Online Movie and TV Show streaming site' });
  }

  ngOnDestroy(): void {
    this.meta.removeTag('name="description"');
    this.meta.removeTag('property="og:site_name"');
    this.meta.removeTag('property="og:title"');
    this.meta.removeTag('property="og:description"');
  }
}
