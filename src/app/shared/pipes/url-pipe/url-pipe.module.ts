import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SafeUrlPipe } from './safe-url/safe-url.pipe';

@NgModule({
    imports: [CommonModule, SafeUrlPipe],
    exports: [SafeUrlPipe]
})
export class UrlPipeModule { }
