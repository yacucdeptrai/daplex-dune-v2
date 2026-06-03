import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FirstErrorKeyPipe } from './first-error-key/first-error-key.pipe';

@NgModule({
    imports: [CommonModule, FirstErrorKeyPipe],
    exports: [FirstErrorKeyPipe]
})
export class ValidationPipeModule { }
