import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DompurifyPipe } from './dompurify/dompurify.pipe';
import { DompurifyService } from './dompurify/dompurify.service';

@NgModule({
    imports: [CommonModule, DompurifyPipe],
    providers: [DompurifyService],
    exports: [DompurifyPipe]
})
export class HtmlPipeModule { }
