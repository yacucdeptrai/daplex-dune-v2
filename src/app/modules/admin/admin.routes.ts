import { Routes } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';

import { AuthGuard, ConfirmDeactivateGuard, WsActivatorGuard } from '../../core/guards';
import { ConfirmActionService, QueueUploadService } from '../../core/services';
import { WS_AUTH, WS_NAMESPACE, WsService } from '../../shared/modules/ws';
import { AdminLayoutComponent } from '../../shared/layouts/admin-layout';
import { AuditLogComponent } from './pages/audit-log/audit-log.component';
import { GenresComponent } from './pages/genres/genres.component';
import { MediaComponent } from './pages/media/media.component';
import { ProductionsComponent } from './pages/productions/productions.component';
import { UserPermission } from '../../core/enums';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, WsActivatorGuard],
    canDeactivate: [ConfirmDeactivateGuard, WsActivatorGuard],
    data: {
      withPermissions: [UserPermission.MANAGE_MEDIA, UserPermission.ADMINISTRATOR]
    },
    providers: [
      DialogService,
      ConfirmationService,
      ConfirmActionService,
      QueueUploadService,
      AuthGuard,
      ConfirmDeactivateGuard,
      WsActivatorGuard,
      WsService,
      {
        provide: TRANSLOCO_SCOPE,
        useValue: ['admin', 'media']
      },
      {
        provide: WS_NAMESPACE,
        useValue: 'admin'
      },
      {
        provide: WS_AUTH,
        useValue: true
      }
    ],
    children: [
      {
        path: 'genres',
        component: GenresComponent
      },
      {
        path: 'productions',
        component: ProductionsComponent
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
