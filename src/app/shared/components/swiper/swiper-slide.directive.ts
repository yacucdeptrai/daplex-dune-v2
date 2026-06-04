import { Directive, TemplateRef } from '@angular/core';

@Directive({ selector: 'ng-template[swiperSlide]' })
export class SwiperSlideDirective {
  constructor(public readonly template: TemplateRef<unknown>) { }
}
