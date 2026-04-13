import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
    selector: '([formGroup])[formAutofocus]',
    standalone: false
})
export class FormAutofocusDirective {

  focusables = ['input', 'select', 'textarea'];

  constructor(private element: ElementRef) { }

  @HostListener('submit')
  submit() {
    const input = this.element.nativeElement.querySelector(this.focusables.map((x) => `${x}.ng-invalid`).join(','))
    if (input)
      input.focus();
  }
}
