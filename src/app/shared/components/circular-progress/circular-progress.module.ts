import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CircularProgressComponent } from './circular-progress.component';

@NgModule({
    imports: [
        CommonModule,
        CircularProgressComponent
    ],
    exports: [CircularProgressComponent]
})
export class CircularProgressModule { }
