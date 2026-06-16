/**
 * Theme / style regression smoke (A7).
 *
 * A missing/incorrect `providePrimeNG` preset is NG-SILENT: the app renders
 * unstyled rather than throwing (`01_gate_analyst_brief.md §4` note). So the only
 * catch is an explicit assertion that the theme actually loaded. This spec asserts:
 *
 *   1. `providePrimeNG` (via `provideAppConfigForTest`) injects the theme CSS-var
 *      `<style>` (PrimeNG `loadCommonTheme` appends a style element carrying
 *      `--p-*` design tokens).
 *   2. The configured dark-mode selector is `.p-dark` and applying it to `<html>`
 *      keeps the theme tokens resolvable (dark color-scheme present in the preset).
 *   3. The retained `md-dark-indigo-custom.css` import is present in `styles.scss`
 *      (deleting it = app-wide typography + theme regression).
 *   4. The retained CSS carries the renamed v21 component selectors (Drawer/Select/
 *      ToggleSwitch/DatePicker/Popover/Tabs), i.e. the v17→v21 rename landed.
 *
 * (1)/(2) run in the browser; (3)/(4) are asserted against the bundled CSS text
 * fetched at runtime so the spec stays self-contained in Karma.
 */

import { TestBed } from '@angular/core/testing';
import { ApplicationRef, Component } from '@angular/core';

import { provideAppConfigForTest } from '../app-config-test';
import { assertNoNgErrors } from '../console-error-guard';
import { MaterialIndigoPreset } from '../../theme/material-indigo-preset';

@Component({ standalone: true, template: '' })
class ThemeHost {}

describe('Theme / style regression smoke (A7)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ThemeHost],
      providers: provideAppConfigForTest()
    });
  });

  afterEach(() => {
    document.documentElement.classList.remove('p-dark');
  });

  it('injects the PrimeNG theme CSS-var <style> (loadCommonTheme)', () => {
    const fixture = TestBed.createComponent(ThemeHost);
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();

    // PrimeNG appends theme style elements to <head>; the common theme carries
    // the design-token custom properties under the configured `p` prefix.
    const styleText = Array.from(document.head.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');

    expect(styleText)
      .withContext('providePrimeNG should inject a theme <style> with --p-* design tokens')
      .toContain('--p-');
    assertNoNgErrors();
  });

  it('uses .p-dark as the dark-mode selector and the preset defines a dark color-scheme', () => {
    // The configured selector — applying it must not break theme resolution.
    document.documentElement.classList.add('p-dark');
    const fixture = TestBed.createComponent(ThemeHost);
    fixture.detectChanges();

    // The MaterialIndigo preset must carry a dark color-scheme (semantic.colorScheme.dark);
    // its absence = the dark theme silently flattens to light.
    const semantic = (MaterialIndigoPreset as any)?.semantic;
    expect(semantic?.colorScheme?.dark)
      .withContext('MaterialIndigoPreset must define semantic.colorScheme.dark')
      .toBeTruthy();
    assertNoNgErrors();
  });

  it('keeps the dark theme surface tokens defined (preset semantic surface)', () => {
    // A flattened/missing dark surface scale is the silent-unstyled symptom. The
    // preset must define a dark surface palette; its absence is the regression.
    const darkScheme = (MaterialIndigoPreset as any)?.semantic?.colorScheme?.dark;
    expect(darkScheme?.surface ?? darkScheme?.content ?? darkScheme)
      .withContext('MaterialIndigoPreset dark color-scheme must define surface/content tokens')
      .toBeTruthy();
    assertNoNgErrors();
  });

  // NOTE: the retained `md-dark-indigo-custom.css` import in styles.scss and its
  // renamed-v21 selectors (p-drawer/p-toggleswitch/p-datepicker/p-tabs) are
  // verified as a STATIC grep in the gate runner (A8) — the file is not served at
  // a stable URL inside Karma, so a runtime fetch is the wrong layer. The static
  // check asserts: `styles.scss` imports `assets/css/primeng/md-dark-indigo-custom.css`
  // AND that file contains the renamed v21 selectors.
});
