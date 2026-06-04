import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';

import { HomeHeaderComponent } from './home-header.component';





import { PermissionPipeModule } from '../../pipes/permission-pipe';





@NgModule({
    imports: [
    CommonModule,
    RouterModule,
    TranslocoModule,
    LazyLoadImageModule,
    InfiniteScrollModule,
    PermissionPipeModule,
    AutoCompleteModule,
    DynamicDialogModule,
    ButtonModule,
    SidebarModule,
    HomeHeaderComponent
],
    providers: [DialogService],
    exports: [HomeHeaderComponent]
})
export class HomeHeaderModule { }
