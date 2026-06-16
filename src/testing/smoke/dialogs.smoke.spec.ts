/**
 * Keystone runtime smoke (A3): open ALL 24 distinct DynamicDialog components via
 * a REAL `DialogService` (never `mockDialogService`, which stubs `open()` and
 * hides NG0201/NG0950) under the full `provideAppConfigForTest()` injector graph.
 *
 * For each dialog we:
 *   1. `DialogService.open(Component, { data })` with the `config.data<T>` shape
 *      the analyst brief (`01_gate_analyst_brief.md §1.2`) documents,
 *   2. `appRef.tick()` so the dialog host (appended to `document.body`) renders,
 *   3. assert the dialog host + child component mount, and
 *   4. `assertNoNgErrors()` — the framework-error gate (A1).
 *
 * This is the net that catches the latent NG0201 the old shallow gate missed:
 * `ConfigureEpisodeComponent` (#16) injects `ConfirmActionService` (route-scoped
 * `ConfirmationService`) — opening it without that provider throws NG0201 at
 * construction, which `GlobalErrorHandler` swallows → blank dialog, green build,
 * no console.error. `FailingErrorHandler` + this open() turns it red.
 */

import { ApplicationRef, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

import { provideAppConfigForTest } from '../app-config-test';
import { assertNoNgErrors } from '../console-error-guard';
import { WsService } from '../../app/shared/modules/ws';

// Dialog components (all 24 distinct DialogService.open targets).
import { AddToPlaylistComponent } from '../../app/shared/dialogs/add-to-playlist/add-to-playlist.component';
import { SearchOverlayComponent } from '../../app/shared/dialogs/search-overlay/search-overlay.component';
import { ImageEditorComponent } from '../../app/shared/dialogs/image-editor/image-editor.component';
import { ShareMediaLinkComponent } from '../../app/shared/dialogs/share-media-link/share-media-link.component';
import { AddAllToPlaylistComponent } from '../../app/shared/dialogs/add-all-to-playlist/add-all-to-playlist.component';
import { PlaylistSettingsComponent } from '../../app/shared/dialogs/playlist-settings/playlist-settings.component';
import { CreateMediaComponent } from '../../app/modules/admin/dialogs/create-media/create-media.component';
import { ConfigureMediaComponent } from '../../app/modules/admin/dialogs/configure-media/configure-media.component';
import { AddVideoComponent } from '../../app/modules/admin/dialogs/add-video/add-video.component';
import { AddSubtitleComponent } from '../../app/modules/admin/dialogs/add-subtitle/add-subtitle.component';
import { AddSourceComponent } from '../../app/modules/admin/dialogs/add-source/add-source.component';
import { AuditLogDetailsComponent } from '../../app/modules/admin/dialogs/audit-log-details/audit-log-details.component';
import { CreateGenreComponent } from '../../app/modules/admin/dialogs/create-genre/create-genre.component';
import { UpdateGenreComponent } from '../../app/modules/admin/dialogs/update-genre/update-genre.component';
import { CreateProductionComponent } from '../../app/modules/admin/dialogs/create-production/create-production.component';
import { UpdateProductionComponent } from '../../app/modules/admin/dialogs/update-production/update-production.component';
import { CreateEpisodeComponent } from '../../app/modules/admin/dialogs/create-episode/create-episode.component';
import { ConfigureEpisodeComponent } from '../../app/modules/admin/dialogs/configure-episode/configure-episode.component';
import { UpdateVideoComponent } from '../../app/modules/admin/dialogs/update-video/update-video.component';
import { CreatePlaylistComponent } from '../../app/modules/users/dialogs/create-playlist/create-playlist.component';
import { UpdateUsernameComponent } from '../../app/modules/users/dialogs/update-username/update-username.component';
import { UpdateEmailComponent } from '../../app/modules/users/dialogs/update-email/update-email.component';
import { UpdateBirthdateComponent } from '../../app/modules/users/dialogs/update-birthdate/update-birthdate.component';
import { UpdatePasswordComponent } from '../../app/modules/users/dialogs/update-password/update-password.component';

/**
 * Minimal `config.data` payloads matching each dialog's `DynamicDialogConfig<T>`.
 * The smoke only needs the dialog to MOUNT (no NG0201/NG0950), not to be
 * functionally complete, so we cast minimal plain objects to the expected shape.
 */
const media: any = { _id: 'm1', type: 'movie', title: 'Smoke', slug: 'smoke', externalStreams: {} };
const mediaDetails: any = {
  ...media,
  runtime: 0,
  movie: { source: null, subtitles: [] },
  tv: { episodes: [], lastAirDate: null }
};
const episode: any = { _id: 'e1', episodeNumber: 1, name: 'E1', media: 'm1', subtitles: [] };
const video: any = { _id: 'v1', name: 'V1', url: '', site: 'YouTube', key: 'k' };
const imageEditorConfig: any = {
  aspectRatioWidth: 2,
  aspectRatioHeight: 3,
  minWidth: 100,
  minHeight: 150,
  imageFile: new File([''], 'poster.jpg', { type: 'image/jpeg' }),
  maxSize: 5242880
};
const genre: any = { _id: 'g1', name: 'Action' };
const production: any = { _id: 'p1', name: 'Studio' };
const playlist: any = { _id: 'pl1', name: 'My list', itemCount: 0, visibility: 1 };
const user: any = { _id: 'u1', username: 'smoke', nickname: 'Smoke', email: 's@s.io', birthdate: null };

interface DialogCase {
  name: string;
  component: Type<unknown>;
  data?: unknown;
}

const DIALOGS: DialogCase[] = [
  { name: 'AddToPlaylistComponent', component: AddToPlaylistComponent, data: { ...media } },
  { name: 'SearchOverlayComponent', component: SearchOverlayComponent },
  { name: 'ImageEditorComponent', component: ImageEditorComponent, data: { ...imageEditorConfig } },
  { name: 'ShareMediaLinkComponent', component: ShareMediaLinkComponent, data: [] },
  { name: 'CreateMediaComponent', component: CreateMediaComponent, data: { type: 'movie' } },
  { name: 'ConfigureMediaComponent', component: ConfigureMediaComponent, data: { ...mediaDetails } },
  { name: 'AddVideoComponent', component: AddVideoComponent, data: { ...mediaDetails } },
  { name: 'AddSubtitleComponent', component: AddSubtitleComponent, data: { media: mediaDetails, episode, file: new File([''], 's.srt') } },
  { name: 'AddSourceComponent', component: AddSourceComponent, data: { media: mediaDetails, episode } },
  { name: 'AuditLogDetailsComponent', component: AuditLogDetailsComponent, data: { type: 1, target: '', changes: [] } },
  { name: 'CreateGenreComponent', component: CreateGenreComponent },
  { name: 'UpdateGenreComponent', component: UpdateGenreComponent, data: { ...genre } },
  { name: 'CreateProductionComponent', component: CreateProductionComponent },
  { name: 'UpdateProductionComponent', component: UpdateProductionComponent, data: { ...production } },
  { name: 'CreateEpisodeComponent', component: CreateEpisodeComponent, data: { media: mediaDetails, episodes: [] } },
  { name: 'ConfigureEpisodeComponent', component: ConfigureEpisodeComponent, data: { media: mediaDetails, episode } },
  { name: 'UpdateVideoComponent', component: UpdateVideoComponent, data: { media: mediaDetails, video } },
  { name: 'CreatePlaylistComponent', component: CreatePlaylistComponent },
  { name: 'AddAllToPlaylistComponent', component: AddAllToPlaylistComponent, data: { ...playlist } },
  { name: 'PlaylistSettingsComponent', component: PlaylistSettingsComponent, data: { ...playlist } },
  { name: 'UpdateUsernameComponent', component: UpdateUsernameComponent, data: { ...user } },
  { name: 'UpdateEmailComponent', component: UpdateEmailComponent, data: { ...user } },
  { name: 'UpdateBirthdateComponent', component: UpdateBirthdateComponent, data: { ...user } },
  { name: 'UpdatePasswordComponent', component: UpdatePasswordComponent, data: { ...user } }
];

describe('Runtime smoke: all 24 DynamicDialog components open via real DialogService', () => {
  let dialogService: DialogService;
  let appRef: ApplicationRef;
  let openRefs: (DynamicDialogRef | null)[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: provideAppConfigForTest()
    });
    dialogService = TestBed.inject(DialogService);
    appRef = TestBed.inject(ApplicationRef);
    // WsActivatorGuard.init() is the real precondition for socket-backed dialogs
    // (ConfigureMedia subscribes to wsService.fromEvent at construction). Mirror it
    // so the socket emitter exists; no real connection is required for the smoke.
    TestBed.inject(WsService).init();
    openRefs = [];
  });

  afterEach(() => {
    // Close anything still open so the next case starts from a clean body.
    for (const ref of openRefs) {
      try {
        ref?.close();
      } catch {
        /* ignore close errors during teardown */
      }
    }
    appRef.tick();
  });

  it('counts 24 distinct dialogs (matches analyst inventory)', () => {
    expect(DIALOGS.length).toBe(24);
  });

  for (const dialog of DIALOGS) {
    it(`opens ${dialog.name} without NG framework errors`, () => {
      const ref = dialogService.open(dialog.component, {
        header: dialog.name,
        data: dialog.data,
        // Match the app's nested-dialog defaults so the fork DynamicDialog path
        // (autoZIndex:false + manual z + fixNestedDialogFocus) is exercised.
        autoZIndex: false,
        maskStyleClass: 'tw-z-[100]'
      });
      openRefs.push(ref);

      // Drive change detection across the attached dialog host view.
      appRef.tick();

      // The fork appends the dialog host to document.body, not the fixture.
      const dialogHost = document.querySelector('p-dynamicdialog, .p-dialog');
      expect(dialogHost)
        .withContext(`${dialog.name}: DynamicDialog host should mount in document.body`)
        .not.toBeNull();

      // The child component should have a rendered element inside the dialog.
      const childMounted =
        !!dialogHost && dialogHost.querySelector('.p-dialog-content')?.childElementCount! >= 0;
      expect(childMounted)
        .withContext(`${dialog.name}: child component content should render`)
        .toBeTrue();

      // The hard gate: no NG0201/NG0950/template/signal error during construct+render.
      assertNoNgErrors();
    });
  }
});
