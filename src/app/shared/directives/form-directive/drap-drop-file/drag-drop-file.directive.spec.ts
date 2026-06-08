import { ElementRef } from '@angular/core';

import { DragDropFileDirective } from './drag-drop-file.directive';

describe('DragDropFileDirective', () => {
  it('should create an instance', () => {
    const directive = new DragDropFileDirective(document, {} as ElementRef);
    expect(directive).toBeTruthy();
  });
});
