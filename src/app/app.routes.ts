import { Routes } from '@angular/router';

import { HomeLayoutComponent } from './shared/layouts/home-layout';

export const routes: Routes = [
  {
    path: '',
    component: HomeLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./modules/home/home.routes').then(m => m.HOME_ROUTES)
      },
      {
        path: '',
        loadChildren: () => import('./modules/auth/auth.routes').then(m => m.AUTH_ROUTES)
      },
      {
        path: '',
        loadChildren: () => import('./modules/media/media.routes').then(m => m.MEDIA_ROUTES)
      },
      {
        path: 'admin',
        loadChildren: () => import('./modules/admin/admin.routes').then(m => m.ADMIN_ROUTES)
      },
      {
        path: 'users',
        loadChildren: () => import('./modules/users/users.routes').then(m => m.USERS_ROUTES)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
