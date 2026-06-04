import { Routes } from '@angular/router';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';

import { HomeComponent } from './pages/home/home.component';

export const HOME_ROUTES: Routes = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
    data: {
      title: 'home'
    },
    providers: [
      {
        provide: TRANSLOCO_SCOPE,
        useValue: ['home', 'media']
      }
    ]
  }
];
