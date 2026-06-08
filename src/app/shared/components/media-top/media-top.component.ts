import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { TRANSLOCO_SCOPE, TranslocoDirective } from '@jsverse/transloco';

import { MediaType } from '../../../core/enums';
import { Media, Paginated } from '../../../core/models';
import { track_Id } from '../../../core/utils';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { ThumbhashUrlPipe } from '../../pipes/placeholder-pipe/thumbhash-url/thumbhash-url.pipe';

@Component({
    selector: 'app-media-top',
    templateUrl: './media-top.component.html',
    styleUrls: ['./media-top.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: TRANSLOCO_SCOPE,
            useValue: 'media'
        }
    ],
    imports: [TranslocoDirective, NgIf, NgFor, RouterLink, LazyLoadImageModule, SkeletonComponent, DecimalPipe, ThumbhashUrlPipe]
})
export class MediaTopComponent implements OnInit {
  MediaType = MediaType;
  @Input() loading: boolean = false;
  @Input() mediaList?: Media[];
  @Input() itemLimit: number = 5;
  @Input() elements: string[] = [];
  track_Id = track_Id;

  skeletonArray: Array<any>;

  constructor() {
    this.skeletonArray = new Array(this.itemLimit);
  }

  ngOnInit(): void {
  }

}
