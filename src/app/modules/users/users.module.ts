import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LayoutModule } from '@angular/cdk/layout';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ProgressBarModule } from 'primeng/progressbar';
import { InputSwitchModule } from 'primeng/inputswitch';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';
import { TabMenuModule } from 'primeng/tabmenu';
import { SliderAltModule } from 'primeng/slideralt';
import { TableModule } from 'primeng/table';

import { UsersRoutingModule } from './users-routing.module';
import { UsersLayoutComponent } from './layouts/users-layout';
import { SettingsLayoutComponent } from './layouts/settings-layout';
import { ProfileComponent } from './pages/profile/profile.component';
import { PlaylistsComponent } from './pages/playlists/playlists.component';
import { HistoryComponent } from './pages/history/history.component';
import { AccountSettingsComponent } from './pages/settings/account-settings/account-settings.component';
import { ProfileSettingsComponent } from './pages/settings/profile-settings/profile-settings.component';
import { PrivacySettingsComponent } from './pages/settings/privacy-settings/privacy-settings.component';
import { MediaSettingsComponent } from './pages/settings/media-settings/media-settings.component';
import { SubtitleSettingsComponent } from './pages/settings/subtitle-settings/subtitle-settings.component';
import { PlaylistCardComponent } from './components/playlist-card';
import { HistoryCardComponent } from './components/history-card';
import { RatingCardComponent } from './components/rating-card';

import { CreatePlaylistComponent } from './dialogs/create-playlist';
import { UpdateUsernameComponent } from './dialogs/update-username';
import { UpdateEmailComponent } from './dialogs/update-email';
import { UpdatePasswordComponent } from './dialogs/update-password';
import { UpdateBirthdateComponent } from './dialogs/update-birthdate';






import { OverlayPanelModule } from '../../shared/directives/overlay-panel';



import { MarkdownPipeModule } from '../../shared/pipes/markdown-pipe';
import { HtmlPipeModule } from '../../shared/pipes/html-pipe';


import { ConfirmActionService, UsersService } from '../../core/services';
import { RatedComponent } from './pages/rated/rated.component';






@NgModule({
    imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LayoutModule,
    DragDropModule,
    TranslocoModule,
    UsersRoutingModule,
    MarkdownPipeModule,
    HtmlPipeModule,
    LazyLoadImageModule,
    InfiniteScrollModule,
    OverlayPanelModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    CalendarModule,
    DropdownModule,
    ConfirmDialogModule,
    DynamicDialogModule,
    RadioButtonModule,
    ProgressBarModule,
    InputSwitchModule,
    SelectButtonModule,
    ToggleButtonModule,
    TooltipModule,
    TabMenuModule,
    SliderAltModule,
    TableModule,
    UsersLayoutComponent,
    SettingsLayoutComponent,
    ProfileComponent,
    PlaylistsComponent,
    HistoryComponent,
    RatedComponent,
    CreatePlaylistComponent,
    PlaylistCardComponent,
    HistoryCardComponent,
    RatingCardComponent,
    AccountSettingsComponent,
    ProfileSettingsComponent,
    PrivacySettingsComponent,
    MediaSettingsComponent,
    UpdateUsernameComponent,
    UpdateEmailComponent,
    UpdatePasswordComponent,
    UpdateBirthdateComponent,
    SubtitleSettingsComponent
],
    providers: [
        UsersService,
        DialogService,
        ConfirmationService,
        ConfirmActionService,
        {
            provide: TRANSLOCO_SCOPE,
            useValue: ['users', 'media']
        }
    ]
})
export class UsersModule { }
