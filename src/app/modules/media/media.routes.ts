import { Routes } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';

import { SearchComponent } from './pages/search/search.component';
import { DetailsComponent } from './pages/details/details.component';
import { PlaylistsComponent } from './pages/playlists/playlists.component';
import { WatchComponent } from './pages/watch/watch.component';
import { ListComponent } from './pages/list/list.component';

const mediaProviders = [
  DialogService,
  {
    provide: TRANSLOCO_SCOPE,
    useValue: 'media'
  }
];

export const MEDIA_ROUTES: Routes = [
  {
    path: 'search',
    component: SearchComponent,
    data: {
      title: 'search',
      shouldReuse: true,
      reuseRoutesFrom: ['details/:id']
    },
    providers: mediaProviders
  },
  {
    path: 'list/:path',
    component: ListComponent,
    data: {
      disableTitleStrategy: true,
      shouldReuse: true,
      reuseRoutesFrom: ['details/:id']
    },
    providers: mediaProviders
  },
  {
    path: 'list/:path/:sub_path',
    component: ListComponent,
    data: {
      disableTitleStrategy: true,
      shouldReuse: true,
      reuseRoutesFrom: ['details/:id']
    },
    providers: mediaProviders
  },
  {
    path: 'details/:id',
    component: DetailsComponent,
    data: {
      disableTitleStrategy: true,
      fixedNavbarSpacing: false
    },
    providers: mediaProviders
  },
  {
    path: 'playlists/:id',
    component: PlaylistsComponent,
    data: {
      disableTitleStrategy: true,
      shouldReuse: true,
      reuseRoutesFrom: ['watch/:id']
    },
    providers: mediaProviders
  },
  {
    path: 'watch/:id',
    component: WatchComponent,
    data: {
      disableTitleStrategy: true
    },
    providers: mediaProviders
  }
];
