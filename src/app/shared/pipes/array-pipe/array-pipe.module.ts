import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ArrayIncludesPipe } from './array-includes/array-includes.pipe';

@NgModule({
    imports: [CommonModule, ArrayIncludesPipe],
    exports: [ArrayIncludesPipe]
})
export class ArrayPipeModule { }
