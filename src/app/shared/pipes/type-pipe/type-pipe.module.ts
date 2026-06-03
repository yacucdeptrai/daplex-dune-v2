import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IsTypeOfPipe } from './is-type-of/is-type-of.pipe';

@NgModule({
    imports: [
        CommonModule,
        IsTypeOfPipe
    ],
    exports: [
        IsTypeOfPipe
    ]
})
export class TypePipeModule { }
