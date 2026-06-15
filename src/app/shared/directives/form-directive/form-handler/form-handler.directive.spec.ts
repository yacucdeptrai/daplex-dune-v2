import { ElementRef } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';

import { FormHandlerDirective } from './form-handler.directive';

describe('FormHandlerDirective', () => {
  it('should create an instance', () => {
    const directive = new FormHandlerDirective({} as FormGroupDirective, {} as ElementRef);
    expect(directive).toBeTruthy();
  });
});
