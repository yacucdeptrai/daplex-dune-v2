import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core';
import { Subscription } from 'rxjs';

import {
  NativeSwiperOptions,
  NativeSwiperRef,
  NativeSwiperSlideChangeEvent
} from './swiper.types';
import { SwiperSlideDirective } from './swiper-slide.directive';

@Component({
  selector: 'swiper',
  templateUrl: './swiper.component.html',
  styleUrls: ['./swiper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class SwiperComponent implements AfterContentInit, AfterViewInit, OnDestroy {
  @Input() config: NativeSwiperOptions = {};
  @Output() slideChange = new EventEmitter<NativeSwiperSlideChangeEvent>();

  @ContentChildren(SwiperSlideDirective) slideTemplates!: QueryList<SwiperSlideDirective>;
  @ViewChildren('slideElement') private slideElements!: QueryList<ElementRef<HTMLElement>>;

  activeIndex: number = 0;

  private autoplayTimer?: ReturnType<typeof setInterval>;
  private navUnsubscribers: Array<() => void> = [];
  private slideChangesSub?: Subscription;
  private isMouseOver: boolean = false;

  constructor(private readonly cdr: ChangeDetectorRef) { }

  get allowTouchMove(): boolean {
    return this.config.allowTouchMove !== false;
  }

  get paginationClickable(): boolean {
    return this.config.pagination?.clickable === true;
  }

  ngAfterContentInit(): void {
    this.slideChangesSub = this.slideTemplates.changes.subscribe(() => {
      this.activeIndex = this.normalizeIndex(this.activeIndex);
      this.cdr.markForCheck();
      queueMicrotask(() => this.emitSlideChange());
    });
  }

  ngAfterViewInit(): void {
    this.bindNavigationButtons();
    this.startAutoplay();
    queueMicrotask(() => this.emitSlideChange());
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
    this.slideChangesSub?.unsubscribe();
    this.navUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.navUnsubscribers = [];
  }

  onMouseEnter(): void {
    this.isMouseOver = true;
  }

  onMouseLeave(): void {
    this.isMouseOver = false;
  }

  onPaginationClick(index: number): void {
    this.goTo(index, true);
  }

  private next(interacted: boolean): void {
    this.goTo(this.activeIndex + 1, interacted);
  }

  private prev(interacted: boolean): void {
    this.goTo(this.activeIndex - 1, interacted);
  }

  private goTo(index: number, interacted: boolean): void {
    const nextIndex = this.normalizeIndex(index);
    if (nextIndex === this.activeIndex && this.slideElements.length > 0) {
      return;
    }

    this.activeIndex = nextIndex;
    this.cdr.markForCheck();

    queueMicrotask(() => {
      const currentSlide = this.slideElements.get(this.activeIndex)?.nativeElement;
      if (currentSlide) {
        currentSlide.scrollIntoView({
          behavior: 'smooth',
          inline: 'start',
          block: 'nearest'
        });
      }
      this.emitSlideChange();
    });

    if (interacted && this.config.autoplay?.disableOnInteraction) {
      this.stopAutoplay();
    }
  }

  private normalizeIndex(index: number): number {
    const total = this.slideTemplates?.length ?? 0;
    if (total === 0) {
      return 0;
    }

    if (this.config.loop) {
      return (index % total + total) % total;
    }

    return Math.max(0, Math.min(index, total - 1));
  }

  private emitSlideChange(): void {
    const slides = this.slideElements.map(element => element.nativeElement);
    const swiperRef: NativeSwiperRef = {
      activeIndex: this.activeIndex,
      slides
    };
    this.slideChange.emit([swiperRef]);
  }

  private startAutoplay(): void {
    if (!this.config.autoplay) {
      return;
    }

    this.stopAutoplay();
    const delay = this.config.autoplay.delay ?? 3000;
    this.autoplayTimer = setInterval(() => {
      const shouldPause = this.config.autoplay?.pauseOnMouseEnter && this.isMouseOver;
      if (shouldPause) {
        return;
      }
      this.next(false);
    }, delay);
  }

  private stopAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = undefined;
    }
  }

  private bindNavigationButtons(): void {
    this.unbindNavigationButtons();

    const prevButton = this.resolveElement(this.config.navigation?.prevEl);
    const nextButton = this.resolveElement(this.config.navigation?.nextEl);

    if (prevButton) {
      const handlePrev = () => this.prev(true);
      prevButton.addEventListener('click', handlePrev);
      this.navUnsubscribers.push(() => prevButton.removeEventListener('click', handlePrev));
    }

    if (nextButton) {
      const handleNext = () => this.next(true);
      nextButton.addEventListener('click', handleNext);
      this.navUnsubscribers.push(() => nextButton.removeEventListener('click', handleNext));
    }
  }

  private unbindNavigationButtons(): void {
    this.navUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.navUnsubscribers = [];
  }

  private resolveElement(target?: string | HTMLElement): HTMLElement | null {
    if (!target) {
      return null;
    }
    if (typeof target === 'string') {
      return document.querySelector<HTMLElement>(target);
    }
    return target;
  }
}
