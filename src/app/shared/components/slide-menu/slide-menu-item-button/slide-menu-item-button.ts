/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Directive } from '@angular/core';

import { SlideMenuItem } from '../slide-menu-item/slide-menu-item';

@Directive({
    selector: '[slideMenuItemButton]',
    exportAs: 'slideMenuItemButton',
    host: {
        'role': 'menuitembutton',
        '[class.slide-menu-button]': 'true',
        '[class.slide-menu-button-checked]': 'false'
    },
    providers: [
        { provide: SlideMenuItem, useExisting: SlideMenuItemButton }
    ],
    standalone: false
})
export class SlideMenuItemButton extends SlideMenuItem {
  protected override keepOpen = true;
}
