import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutModule } from '@angular/cdk/layout';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';

import { MediaRoutingModule } from './media-routing.module';
import { MediaFilterModule } from '../../shared/components/media-filter';
import { MediaListModule } from '../../shared/components/media-list';





import { ExpansionPanelComponent } from '../../shared/components/expansion-panel';


import { SearchComponent } from './pages/search/search.component';
import { WatchComponent } from './pages/watch/watch.component';
import { DetailsComponent } from './pages/details/details.component';
import { PlaylistsComponent } from './pages/playlists/playlists.component';
import { ListComponent } from './pages/list/list.component';
import { CollectionListComponent } from './components/collection-list/collection-list.component';
import { CollectionMediaListComponent } from './components/collection-media-list/collection-media-list.component';


import { OverlayPanelModule } from '../../shared/directives/overlay-panel';







@NgModule({
    imports: [
    CommonModule,
    LayoutModule,
    MediaRoutingModule,
    MediaFilterModule,
    MediaListModule,
    ExpansionPanelComponent,
    TranslocoModule,
    LazyLoadImageModule,
    InfiniteScrollModule,
    OverlayPanelModule,
    ButtonModule,
    DialogModule,
    DynamicDialogModule,
    ToggleButtonModule,
    PaginatorModule,
    TooltipModule,
    TabViewModule,
    TagModule,
    WatchComponent,
    DetailsComponent,
    SearchComponent,
    PlaylistsComponent,
    ListComponent,
    CollectionListComponent,
    CollectionMediaListComponent
],
    providers: [
        DialogService,
        {
            provide: TRANSLOCO_SCOPE,
            useValue: 'media'
        }
    ]
})
export class MediaModule { }
