/**
 * W4.9 runtime smoke: the media-scanner provider-import surfaces.
 *
 * Confirms at runtime (not just build-green) that:
 *   1. MediaScannerImportComponent opens via a REAL DialogService with no NG error
 *      (its DynamicDialogConfig/Ref + root MediaScannerService resolve).
 *   2. The two opener surfaces — CreateMediaComponent and (via the parent)
 *      ConfigureMediaFormComponent — mount with the newly-added module-scoped
 *      DialogService + Renderer2 + DOCUMENT injections WITHOUT NG0201. The brief
 *      flags the configure-media-form claim ("resolves up-tree in prod") for
 *      runtime proof: ConfigureMediaFormComponent is rendered as a child of
 *      ConfigureMediaComponent, so opening the parent constructs the child.
 *   3. The nested open path (opener dialog → scanner dialog) raises no NG0201 and
 *      tracks both refs — the same fork DynamicDialog path the app uses.
 *
 * Uses FailingErrorHandler (via provideAppConfigForTest) so any NG-coded error
 * during construct/render fails the spec instead of being swallowed.
 */

import { ApplicationRef, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

import { provideAppConfigForTest } from '../app-config-test';
import { assertNoNgErrors } from '../console-error-guard';
import { WsService } from '../../app/shared/modules/ws';
import { MediaScannerImportComponent } from '../../app/modules/admin/dialogs/media-scanner-import';
import { CreateMediaComponent } from '../../app/modules/admin/dialogs/create-media/create-media.component';
import { ConfigureMediaComponent } from '../../app/modules/admin/dialogs/configure-media/configure-media.component';

const mediaDetails: any = {
  _id: 'm1', type: 'movie', title: 'Smoke', slug: 'smoke', externalStreams: {},
  runtime: 0, movie: { source: null, subtitles: [] }, tv: { episodes: [], lastAirDate: null },
  externalIds: {}
};

describe('Runtime smoke: media-scanner import surfaces (W4.9)', () => {
  let dialogService: DialogService;
  let appRef: ApplicationRef;
  let refs: (DynamicDialogRef | null)[];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideAppConfigForTest() });
    dialogService = TestBed.inject(DialogService);
    appRef = TestBed.inject(ApplicationRef);
    TestBed.inject(WsService).init();
    refs = [];
  });

  afterEach(() => {
    for (const ref of refs.reverse()) {
      try {
        ref?.close();
      } catch {
        /* ignore teardown close errors */
      }
    }
    appRef.tick();
  });

  function open(component: Type<unknown>, data: unknown): DynamicDialogRef {
    const ref = dialogService.open(component, {
      data,
      autoZIndex: false,
      maskStyleClass: 'tw-z-[100]'
    });
    refs.push(ref);
    appRef.tick();
    expect(ref).withContext(`${(component as any)?.name}: open should return a ref`).toBeTruthy();
    return ref as DynamicDialogRef;
  }

  function assertDialogHostMounted(label: string): void {
    const dialogHost = document.querySelector('p-dynamicdialog, .p-dialog');
    expect(dialogHost).withContext(`${label}: DynamicDialog host should mount`).not.toBeNull();
  }

  it('opens MediaScannerImportComponent standalone without NG errors (movie lane)', () => {
    open(MediaScannerImportComponent, { type: 'movie' });
    assertDialogHostMounted('MediaScannerImportComponent (movie)');
    assertNoNgErrors();
  });

  it('opens MediaScannerImportComponent standalone without NG errors (tv lane)', () => {
    open(MediaScannerImportComponent, { type: 'tv' });
    assertDialogHostMounted('MediaScannerImportComponent (tv)');
    assertNoNgErrors();
  });

  it('mounts CreateMediaComponent (new DialogService/Renderer2/DOCUMENT inject) without NG0201', () => {
    open(CreateMediaComponent, { type: 'movie' });
    assertDialogHostMounted('CreateMediaComponent');
    assertNoNgErrors();
  });

  it('mounts ConfigureMediaComponent → ConfigureMediaFormComponent child without NG0201', () => {
    // The headline claim under test: ConfigureMediaFormComponent now injects the
    // module-scoped DialogService and "resolves up-tree in prod". The parent
    // ConfigureMediaComponent imports + renders the form child, so opening the
    // parent constructs the child under the real injector graph.
    open(ConfigureMediaComponent, { ...mediaDetails });
    assertDialogHostMounted('ConfigureMediaComponent');
    assertNoNgErrors();
  });

  it('opens the scanner dialog NESTED on top of CreateMediaComponent without NG0201', () => {
    open(CreateMediaComponent, { type: 'movie' });
    open(MediaScannerImportComponent, { type: 'movie' });
    expect(dialogService.dialogComponentRefMap.size)
      .withContext('both opener + scanner dialog refs should be tracked')
      .toBeGreaterThanOrEqual(2);
    assertNoNgErrors();
  });

  it('opens the scanner dialog NESTED on top of ConfigureMediaComponent without NG0201', () => {
    open(ConfigureMediaComponent, { ...mediaDetails });
    open(MediaScannerImportComponent, { type: 'movie' });
    expect(dialogService.dialogComponentRefMap.size)
      .withContext('both opener + scanner dialog refs should be tracked')
      .toBeGreaterThanOrEqual(2);
    assertNoNgErrors();
  });
});
