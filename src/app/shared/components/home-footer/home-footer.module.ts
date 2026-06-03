import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';

import { HomeFooterComponent } from './home-footer.component';

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        TranslocoModule,
        HomeFooterComponent
    ],
    exports: [HomeFooterComponent]
})
export class HomeFooterModule { }
