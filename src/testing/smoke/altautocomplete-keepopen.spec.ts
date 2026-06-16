/**
 * DELTA-001 keep-open (`[hideOnSelect]="false"`) RED-proof, ISOLATED.
 *
 * The render-block keep-open assertion lives in
 * `configure-media-form.component.render.spec.ts`, but while the surgeon's in-progress
 * `AltAutoComplete` throws NG0309 (inherited `Bind` hostDirective applied twice) the whole parent
 * render fails in `beforeEach`, so that assertion's body cannot execute. This isolated spec mounts a
 * STOCK `<p-autoComplete [multiple]="true">` in a minimal host — no form, no subclass — to prove the
 * assertion logic genuinely captures the v21 close-on-select default (RED for the restored keep-open):
 * clicking a rendered option closes the panel (`overlayVisible` → false). Once the surgeon re-adds
 * `[hideOnSelect]="false"`, the equivalent render-block test stays open (true).
 *
 * This spec is intentionally GREEN-as-written: it ASSERTS the current stock behavior (panel CLOSES),
 * documenting the baseline the re-port must invert on the 4 configure-media-form sites. It is the
 * characterization counterpart that survives the surgeon's broken intermediate tree.
 */

import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { AutoComplete, AutoCompleteModule } from 'primeng/autocomplete';
import { providePrimeNG } from 'primeng/config';

@Component({
  standalone: true,
  imports: [AutoCompleteModule, FormsModule],
  template: `
    <p-autoComplete #ac [(ngModel)]="value" [suggestions]="suggestions" [multiple]="true"
      optionLabel="name" dataKey="_id"></p-autoComplete>
  `
})
class StockMultiAutoCompleteHost {
  value: any[] = [];
  suggestions: any[] = [{ _id: 'g3', name: 'Drama' }];
  ac = viewChild.required<AutoComplete>('ac');
}

describe('DELTA-001 keep-open RED-proof: stock p-autoComplete CLOSES on select (v21 default)', () => {
  let fixture: ComponentFixture<StockMultiAutoCompleteHost>;
  let host: StockMultiAutoCompleteHost;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StockMultiAutoCompleteHost],
      providers: [provideNoopAnimations(), providePrimeNG({})]
    });
    fixture = TestBed.createComponent(StockMultiAutoCompleteHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('clicking a rendered option closes the panel (the behavior [hideOnSelect]="false" must INVERT)', fakeAsync(() => {
    const ac = host.ac();
    ac.show();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(ac.overlayVisible).withContext('panel open before the pick').toBeTrue();

    const option = (fixture.nativeElement.querySelector('.p-autocomplete-option')
      || document.querySelector('.p-autocomplete-option')) as HTMLElement | null;
    expect(option).withContext('a suggestion option must render in the open panel').toBeTruthy();

    option!.click();
    tick();
    fixture.detectChanges();
    flush();

    // Selection applied...
    expect(ac.modelValue()?.length).withContext('the picked option is added to the model').toBe(1);
    // ...and the STOCK v21 panel CLOSES (onOptionSelect isHide defaults true). The re-ported
    // configure-media-form control with [hideOnSelect]="false" must keep this TRUE instead.
    expect(ac.overlayVisible)
      .withContext('STOCK v21 closes on select — restored [hideOnSelect]="false" must keep it open')
      .toBeFalse();
  }));
});
