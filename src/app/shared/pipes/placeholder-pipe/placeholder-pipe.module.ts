import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ThumbhashUrlPipe } from './thumbhash-url/thumbhash-url.pipe';

@NgModule({
    imports: [
        CommonModule,
        ThumbhashUrlPipe
    ],
    exports: [
        ThumbhashUrlPipe
    ]
})
export class PlaceholderPipeModule { }
