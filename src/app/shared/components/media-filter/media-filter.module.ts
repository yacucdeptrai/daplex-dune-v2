import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';

import { MediaFilterComponent } from './media-filter.component';
import { MediaFilterService } from './media-filter.service';




@NgModule({
    imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    ToggleButtonModule,
    TooltipModule,
    ChipModule,
    MediaFilterComponent
],
    providers: [MediaFilterService],
    exports: [MediaFilterComponent]
})
export class MediaFilterModule { }
