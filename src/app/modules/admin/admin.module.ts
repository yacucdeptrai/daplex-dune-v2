import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputMaskModule } from 'primeng/inputmask';
import { DropdownModule } from 'primeng/dropdown';
import { MessageModule } from 'primeng/message';
import { ChipModule } from 'primeng/chip';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { AdminRoutingModule } from './admin-routing.module';

import { MediaComponent } from './pages/media/media.component';
import { GenresComponent } from './pages/genres/genres.component';
import { ProductionsComponent } from './pages/productions/productions.component';
import { CreateGenreComponent } from './dialogs/create-genre/create-genre.component';
import { UpdateGenreComponent } from './dialogs/update-genre/update-genre.component';
import { AuditLogComponent } from './pages/audit-log/audit-log.component';
import { AuditLogDetailsComponent } from './dialogs/audit-log-details/audit-log-details.component';











import { WS_AUTH, WS_NAMESPACE, WsModule } from '../../shared/modules/ws';
import { CreateProductionComponent } from './dialogs/create-production/create-production.component';
import { UpdateProductionComponent } from './dialogs/update-production/update-production.component';
import { CreateMediaComponent } from './dialogs/create-media/create-media.component';
import { AddVideoComponent } from './dialogs/add-video/add-video.component';
import { UpdateVideoComponent } from './dialogs/update-video/update-video.component';
import { CreateEpisodeComponent } from './dialogs/create-episode/create-episode.component';
import { AddSubtitleComponent } from './dialogs/add-subtitle/add-subtitle.component';
import { ConfigureMediaComponent } from './dialogs/configure-media/configure-media.component';
import { AddSourceComponent } from './dialogs/add-source/add-source.component';
import { ConfigureEpisodeComponent } from './dialogs/configure-episode/configure-episode.component';
import { AddExtStreamsComponent } from './components/add-ext-streams/add-ext-streams.component';
import { AuthGuard, ConfirmDeactivateGuard, WsActivatorGuard } from '../../core/guards';
import { ConfirmActionService, QueueUploadService } from '../../core/services';


@NgModule({
    imports: [
    CommonModule,
    AdminRoutingModule,
    ReactiveFormsModule,
    TranslocoModule,
    LazyLoadImageModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    MenuModule,
    TooltipModule,
    TableModule,
    DialogModule,
    DynamicDialogModule,
    ProgressSpinnerModule,
    ConfirmDialogModule,
    RadioButtonModule,
    InputSwitchModule,
    InputNumberModule,
    InputMaskModule,
    DropdownModule,
    MessageModule,
    ChipModule,
    WsModule,
    InfiniteScrollModule,
    MediaComponent,
    GenresComponent,
    ProductionsComponent,
    AuditLogComponent,
    CreateGenreComponent,
    UpdateGenreComponent,
    AuditLogDetailsComponent,
    CreateProductionComponent,
    UpdateProductionComponent,
    CreateMediaComponent,
    ConfigureMediaComponent,
    AddVideoComponent,
    UpdateVideoComponent,
    CreateEpisodeComponent,
    AddSubtitleComponent,
    AddSourceComponent,
    ConfigureEpisodeComponent,
    AddExtStreamsComponent
],
    providers: [
        DialogService,
        ConfirmationService,
        ConfirmActionService,
        QueueUploadService,
        AuthGuard,
        ConfirmDeactivateGuard,
        WsActivatorGuard,
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
    ]
})
export class AdminModule { }
