import { AfterViewInit, Directive, ElementRef, Renderer2 } from '@angular/core';

// PrimeNG v21 ProgressBar emits an invalid `aria-level` on its role="progressbar"
// element (axe: aria-allowed-attr + aria-valid-attr-value). Strip it consumer-side.
// TODO: proper fix belongs in the PrimeNG fork (primeng-v21 lane).
@Directive({ selector: '[appStripAriaLevel]' })
export class StripAriaLevelDirective implements AfterViewInit {
  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) { }

  ngAfterViewInit(): void {
    const host = this.el.nativeElement;
    const target = host.getAttribute('role') === 'progressbar'
      ? host
      : host.querySelector('[role="progressbar"]');
    if (target) this.renderer.removeAttribute(target, 'aria-level');
  }
}
