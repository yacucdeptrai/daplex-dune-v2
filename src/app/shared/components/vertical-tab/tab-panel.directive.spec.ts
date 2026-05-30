import { TemplateRef } from '@angular/core';

import { TabPanelDirective } from './tab-panel.directive';

describe('TabPanelDirective', () => {
  it('should create an instance', () => {
    const directive = new TabPanelDirective({} as TemplateRef<unknown>);
    expect(directive).toBeTruthy();
  });
});
