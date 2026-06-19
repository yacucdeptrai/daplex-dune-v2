import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

/**
 * Close a DynamicDialog on a mousedown outside its box, or on Escape. The fork's
 * `dismissableMask` is inert — it binds the mask handler from `onAnimationStart`, which the
 * v21 fork never wires to a template event — so dialogs that want click-outside-to-close use
 * this instead. Escape is also handled here so callers needn't set `closeOnEscape` per open
 * site. The opening click fires before the host directive binds, so it never self-closes.
 */
// p-select/autocomplete/etc. panels render appendTo="body" OUTSIDE .p-dialog, so a click on
// one looks like an outside-the-dialog click and would wrongly dismiss the dialog. Treat any
// click inside a PrimeNG overlay panel as inside.
const OVERLAY_PANEL_SELECTOR =
  '.p-select-overlay,.p-autocomplete-overlay,.p-multiselect-overlay,.p-datepicker-panel,.p-popover,.p-overlay';

@Directive({
  selector: '[appDialogDismiss]',
  standalone: true
})
export class DialogDismissDirective {
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private dialogRef = inject(DynamicDialogRef, { optional: true });

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    if (!this.dialogRef) return;
    const target = event.target;
    if (target instanceof Element && target.closest(OVERLAY_PANEL_SELECTOR)) return;
    const dialog = this.elementRef.nativeElement.closest('.p-dialog');
    if (dialog && !dialog.contains(target as Node)) {
      this.dialogRef.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.dialogRef?.close();
  }
}
