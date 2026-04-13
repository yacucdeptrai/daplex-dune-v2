export interface NativeSwiperAutoplayOptions {
  delay?: number;
  pauseOnMouseEnter?: boolean;
  disableOnInteraction?: boolean;
}

export interface NativeSwiperNavigationOptions {
  prevEl?: string | HTMLElement;
  nextEl?: string | HTMLElement;
}

export interface NativeSwiperPaginationOptions {
  clickable?: boolean;
}

export interface NativeSwiperOptions {
  autoplay?: NativeSwiperAutoplayOptions;
  navigation?: NativeSwiperNavigationOptions;
  loop?: boolean;
  pagination?: NativeSwiperPaginationOptions;
  allowTouchMove?: boolean;
  slidesPerView?: number;
}

export interface NativeSwiperRef {
  activeIndex: number;
  slides: HTMLElement[];
}

export type NativeSwiperSlideChangeEvent = [NativeSwiperRef];
