import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SwiperComponent } from './swiper.component';
import { SwiperSlideDirective } from './swiper-slide.directive';

@NgModule({
  declarations: [
    SwiperComponent,
    SwiperSlideDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    SwiperComponent,
    SwiperSlideDirective
  ]
})
export class SwiperModule { }
