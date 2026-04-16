import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard, ConfirmDeactivateGuard, WsActivatorGuard } from '../../core/guards';
import { AdminLayoutComponent } from '../../shared/layouts/admin-layout';
import { AuditLogComponent } from './pages/audit-log/audit-log.component';
import { GenresComponent } from './pages/genres/genres.component';
import { MediaComponent } from './pages/media/media.component';
import { ProductionsComponent } from './pages/productions/productions.component';
import { UserPermission } from '../../core/enums';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, WsActivatorGuard],
    canDeactivate: [ConfirmDeactivateGuard, WsActivatorGuard],
    data: {
      withPermissions: [UserPermission.MANAGE_MEDIA, UserPermission.ADMINISTRATOR]
    },
    children: [
      {
        path: 'genres',
        component: GenresComponent
      },
      {
        path: 'productions',
        component: ProductionsComponent,
      },
      {
        path: 'media',
        component: MediaComponent
      },
      {
        path: 'audit-log',
        component: AuditLogComponent,
        canActivate: [AuthGuard],
        data: {
          withPermissions: [UserPermission.ADMINISTRATOR]
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
