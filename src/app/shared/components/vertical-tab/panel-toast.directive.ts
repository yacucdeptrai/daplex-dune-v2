import { ChangeDetectorRef, Directive, Input, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';

@Directive({
    selector: '[appPanelToast]',
    standalone: false
})
export class PanelToastDirective implements OnChanges {
  @Input() tabId?: number | string;
  @Input() visible: boolean = false;
  @Input() styleClass: string = '';

  constructor(public template: TemplateRef<any>, private ref: ChangeDetectorRef) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'])
      this.ref.detectChanges();
  }
}
