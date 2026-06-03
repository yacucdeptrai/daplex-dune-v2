import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StarRatingComponent } from './star-rating.component';
import { CommonDirectiveModule } from '../../directives/common-directive';

@NgModule({
    imports: [
        CommonModule,
        CommonDirectiveModule,
        StarRatingComponent
    ],
    exports: [StarRatingComponent]
})
export class StarRatingModule { }
