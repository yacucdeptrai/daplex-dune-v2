import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ToStringPipe } from './to-string/to-string.pipe';
import { HexColorPipe } from './hex-color/hex-color.pipe';
import { RgbColorPipe } from './rgb-color/rgb-color.pipe';
import { HslColorPipe } from './hsl-color/hsl-color.pipe';

@NgModule({
    imports: [
        CommonModule,
        ToStringPipe,
        HexColorPipe,
        RgbColorPipe,
        HslColorPipe
    ],
    exports: [
        ToStringPipe,
        HexColorPipe,
        RgbColorPipe,
        HslColorPipe
    ]
})
export class NumberPipeModule { }
