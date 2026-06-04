import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { TranslocoModule } from '@ngneat/transloco';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DynamicDialogModule } from 'primeng/dynamicdialog';

import { MediaListComponent } from './media-list.component';


import { OverlayPanelModule } from '../../directives/overlay-panel';




@NgModule({
    imports: [
    CommonModule,
    RouterModule,
    LazyLoadImageModule,
    TranslocoModule,
    OverlayPanelModule,
    ButtonModule,
    TagModule,
    DynamicDialogModule,
    MediaListComponent
],
    exports: [MediaListComponent]
})
export class MediaListModule { }
