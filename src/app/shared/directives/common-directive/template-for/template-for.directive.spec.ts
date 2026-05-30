import { TemplateRef } from '@angular/core';

import { TemplateForDirective } from './template-for.directive';

describe('TemplateForDirective', () => {
  it('should create an instance', () => {
    const directive = new TemplateForDirective({} as TemplateRef<unknown>);
    expect(directive).toBeTruthy();
  });
});
