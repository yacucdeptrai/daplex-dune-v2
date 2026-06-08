import { Component, ChangeDetectionStrategy, Input, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoService, TranslocoDirective } from '@jsverse/transloco';
import { DialogService } from 'primeng/dynamicdialog';
import { Swiper, SwiperOptions } from 'swiper/types';
import { register } from 'swiper/element/bundle';

import { Media } from '../../../../core/models';
import { AuthService } from '../../../../core/services';
import { track_Id } from '../../../../core/utils';
import { AddToPlaylistComponent } from '../../../../shared/dialogs/add-to-playlist';
import { NgTemplateOutlet, NgClass, NgStyle } from '@angular/common';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ButtonModule } from 'primeng/button';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { RgbColorPipe } from '../../../../shared/pipes/number-pipe/rgb-color/rgb-color.pipe';
import { TimePipe } from '../../../../shared/pipes/date-time-pipe/time/time.pipe';
import { ThumbhashUrlPipe } from '../../../../shared/pipes/placeholder-pipe/thumbhash-url/thumbhash-url.pipe';

register();

@Component({
    selector: 'app-featured-media',
    templateUrl: './featured-media.component.html',
    styleUrls: ['./featured-media.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet, TranslocoDirective, NgClass, LazyLoadImageModule, NgStyle, RouterLink, ButtonModule, SkeletonComponent, RgbColorPipe, TimePipe, ThumbhashUrlPipe],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class FeaturedMediaComponent implements OnDestroy {
  track_Id = track_Id;
  @Input() loading: boolean = false;
  @Input() swiperClass?: string;
  @Input() mediaList?: Media[];
  activeTabIndex: number = 0;
  previousSlide?: Element;
  swiperConfig: SwiperOptions;

  private _swiperRef?: ElementRef;

  @ViewChild('swiperRef', { static: false }) set swiperRef(ref: ElementRef | undefined) {
    if (ref && !this._swiperRef) {
      this._swiperRef = ref;
      Object.assign(this._swiperRef.nativeElement, this.swiperConfig);
      this._swiperRef.nativeElement.initialize();
    }
  }

  constructor(private router: Router, private dialogService: DialogService, private translocoService: TranslocoService,
    private authService: AuthService) {
    this.swiperConfig = {
      autoplay: {
        delay: 8000,
        pauseOnMouseEnter: true,
        disableOnInteraction: true
      },
      navigation: {
        prevEl: '#swiper-nav-prev',
        nextEl: '#swiper-nav-next'
      },
      loop: true,
      pagination: {
        clickable: true,
      },
      allowTouchMove: false,
      slidesPerView: 1
    };
  }

  onSwiperSlideChange(event: Event): void {
    const swiper = (event.target as any).swiper as Swiper;
    if (!swiper) return;

    if (this.previousSlide) {
      const buttons = this.previousSlide.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>('button, a');
      buttons.forEach(button => {
        button.tabIndex = -1;
      });
    }
    const slide = swiper.slides[swiper.activeIndex];
    if (slide) {
      const buttons = slide.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>('button, a');
      buttons.forEach(button => {
        button.tabIndex = 0;
      });
      this.previousSlide = slide;
    }
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
