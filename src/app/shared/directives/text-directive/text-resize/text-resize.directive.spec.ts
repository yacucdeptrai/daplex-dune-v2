import { ElementRef, Renderer2 } from '@angular/core';

import { TextResizeDirective } from './text-resize.directive';

describe('TextResizeDirective', () => {
  it('should create an instance', () => {
    const el = { nativeElement: { style: {} } } as unknown as ElementRef<HTMLElement>;
    const directive = new TextResizeDirective(el, {} as Renderer2);
    expect(directive).toBeTruthy();
  });
});
