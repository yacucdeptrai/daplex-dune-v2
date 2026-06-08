import { ChangeDetectorRef, TemplateRef } from '@angular/core';

import { PanelToastDirective } from './panel-toast.directive';

describe('PanelToastDirective', () => {
  it('should create an instance', () => {
    const directive = new PanelToastDirective({} as TemplateRef<unknown>, {} as ChangeDetectorRef);
    expect(directive).toBeTruthy();
  });
});
