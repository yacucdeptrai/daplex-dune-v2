/**
 * DELTA-001 — `selectedItems` count-summary i18n contract.
 *
 * The collapsed "N items selected" token the re-ported `AltAutoComplete` restores is driven by the
 * `admin.{create,update}Media.selectedItems` ICU plural (`src/assets/i18n/admin/en.json:75/175`).
 * This spec locks that plural resolves correctly through the real TranslocoService — decoupled from
 * the DOM — so a later edit to the key (or the surgeon wiring the wrong key/param) breaks a test.
 *
 * Unlike the form render block (which is RED until the re-port lands), this contract is GREEN now:
 * the key already exists. It is the stable guard that the count-summary always renders a *count*,
 * never a raw key or a per-item label, for both the singular (1) and plural (>=2) branches.
 *
 * A small in-spec loader supplies the canonical plural plus the `updateMedia` alias verbatim from
 * en.json so both keys the 8 call-sites read (`createMedia.selectedItems` and
 * `updateMedia.selectedItems`) are covered.
 */

import { TestBed } from '@angular/core/testing';
import { provideTransloco, TranslocoLoader, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { of } from 'rxjs';

class SelectedItemsLoader implements TranslocoLoader {
  getTranslation() {
    return of({
      'admin.createMedia.selectedItems': '{ itemCount, plural, one {1 item selected} other {# items selected} }',
      // The 4 update/configure sites read updateMedia.selectedItems, which aliases createMedia's plural.
      'admin.updateMedia.selectedItems': '{{ admin.createMedia.selectedItems }}'
    });
  }
}

describe('DELTA-001 i18n contract: selectedItems count-summary plural', () => {
  let transloco: TranslocoService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideTransloco({
          config: { availableLangs: ['en'], defaultLang: 'en', reRenderOnLangChange: false, prodMode: false },
          loader: SelectedItemsLoader
        }),
        // The app registers the messageformat transpiler (transloco-root.module.ts:41) — required
        // to resolve the `{ itemCount, plural, ... }` ICU syntax. Mirror it so the contract is real.
        provideTranslocoMessageformat({ locales: ['en-US', 'vi-VN'] })
      ]
    });
    transloco = TestBed.inject(TranslocoService);
    transloco.setActiveLang('en');
    await transloco.load('en').toPromise();
  });

  for (const key of ['admin.createMedia.selectedItems', 'admin.updateMedia.selectedItems']) {
    it(`${key} resolves the SINGULAR branch to "1 item selected"`, () => {
      expect(transloco.translate(key, { itemCount: 1 })).toBe('1 item selected');
    });

    it(`${key} resolves the PLURAL branch to "N items selected"`, () => {
      expect(transloco.translate(key, { itemCount: 2 })).toBe('2 items selected');
      expect(transloco.translate(key, { itemCount: 5 })).toBe('5 items selected');
    });

    it(`${key} renders a COUNT, never the raw key`, () => {
      const out = transloco.translate(key, { itemCount: 3 });
      expect(out).not.toContain(key);
      expect(out).toContain('3');
    });
  }
});
