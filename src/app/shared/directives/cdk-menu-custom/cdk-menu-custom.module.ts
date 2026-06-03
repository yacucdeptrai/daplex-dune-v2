import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkMenuModule } from '@angular/cdk/menu';

import { MenuDirective } from './menu/menu.directive';
import { MenuItemDirective } from './menu-item/menu-item.directive';
import { MenuTriggerDirective } from './menu-trigger/menu-trigger.directive';
import { ContextMenuTriggerDirective } from './context-menu-trigger/context-menu-trigger.directive';

@NgModule({
    imports: [
        CommonModule,
        CdkMenuModule,
        MenuDirective,
        MenuItemDirective,
        MenuTriggerDirective,
        ContextMenuTriggerDirective
    ],
    exports: [
        CdkMenuModule,
        MenuDirective,
        MenuItemDirective,
        MenuTriggerDirective,
        ContextMenuTriggerDirective
    ]
})
export class CdkMenuCustomModule { }
