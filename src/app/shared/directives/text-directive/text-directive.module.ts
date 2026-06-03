import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TextResizeDirective } from './text-resize/text-resize.directive';

@NgModule({
    imports: [CommonModule, TextResizeDirective],
    exports: [TextResizeDirective]
})
export class TextDirectiveModule { }
