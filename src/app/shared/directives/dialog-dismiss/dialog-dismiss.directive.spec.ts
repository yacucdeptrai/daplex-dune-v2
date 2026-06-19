import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

import { DialogDismissDirective } from './dialog-dismiss.directive';

// Host mimics a DynamicDialog content element nested under a .p-dialog box.
@Component({
  standalone: true,
  imports: [DialogDismissDirective],
  template: `<div class="p-dialog"><div appDialogDismiss>content</div></div>`
})
class HostComponent {}

describe('DialogDismissDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let dialogRef: { close: jasmine.Spy };

  const mousedownFrom = (target: Element) => {
    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: target });
    document.dispatchEvent(event);
  };

  beforeEach(() => {
    dialogRef = { close: jasmine.createSpy('close') };
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: DynamicDialogRef, useValue: dialogRef }]
    });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('closes on a mousedown outside the dialog box', () => {
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    mousedownFrom(outside);
    expect(dialogRef.close).toHaveBeenCalled();
    outside.remove();
  });

  it('does NOT close on a mousedown inside the dialog box', () => {
    const inside = fixture.nativeElement.querySelector('[appDialogDismiss]') as Element;
    mousedownFrom(inside);
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('does NOT close on a mousedown inside a body-appended PrimeNG overlay panel', () => {
    // A p-select option panel renders appendTo="body" — outside .p-dialog but must not dismiss.
    const overlay = document.createElement('div');
    overlay.className = 'p-select-overlay';
    const option = document.createElement('li');
    overlay.appendChild(option);
    document.body.appendChild(overlay);
    mousedownFrom(option);
    expect(dialogRef.close).not.toHaveBeenCalled();
    overlay.remove();
  });

  it('does NOT close for the other overlay panel types (autocomplete/multiselect/datepicker/popover)', () => {
    for (const cls of ['p-autocomplete-overlay', 'p-multiselect-overlay', 'p-datepicker-panel', 'p-popover']) {
      dialogRef.close.calls.reset();
      const overlay = document.createElement('div');
      overlay.className = cls;
      document.body.appendChild(overlay);
      mousedownFrom(overlay);
      expect(dialogRef.close).withContext(cls).not.toHaveBeenCalled();
      overlay.remove();
    }
  });

  it('closes on Escape', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(dialogRef.close).toHaveBeenCalled();
  });
});
