import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { TRANSLOCO_SCOPE, TranslocoDirective } from '@ngneat/transloco';

import { MediaDetails, TVEpisode } from '../../../core/models';
import { trackId } from '../../../core/utils';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { ShortDatePipe } from '../../pipes/date-time-pipe/short-date/short-date.pipe';
import { TimePipe } from '../../pipes/date-time-pipe/time/time.pipe';
import { ThumbhashUrlPipe } from '../../pipes/placeholder-pipe/thumbhash-url/thumbhash-url.pipe';

@Component({
    selector: 'app-episode-list',
    templateUrl: './episode-list.component.html',
    styleUrls: ['./episode-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: TRANSLOCO_SCOPE,
            useValue: 'media'
        }
    ],
    imports: [TranslocoDirective, NgIf, NgFor, RouterLinkActive, RouterLink, NgClass, LazyLoadImageModule, SkeletonComponent, ShortDatePipe, TimePipe, ThumbhashUrlPipe]
})
export class EpisodeListComponent implements OnInit {
  @Input() media?: MediaDetails;
  @Input() episodeList?: TVEpisode[];
  @Input() loading: boolean = false;
  @Input() stillStyleClass: string = 'tw-w-full xs:tw-w-28 sm:tw-w-32 tw-flex-shrink-0';
  @Input() infoStyleClass: string = 'tw-w-full xs:tw-w-auto tw-pl-2 tw-py-1';
  @Input() dateAiredStyleClass: string = 'tw-text-sm';
  skeletonArray: Array<any>;
  trackId = trackId;

  constructor() {
    this.skeletonArray = new Array(5);
  }

  ngOnInit(): void {
  }

}
