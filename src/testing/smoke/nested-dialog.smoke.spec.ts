/**
 * Nested-dialog runtime smoke (A3): the 3-level chain
 *   ConfigureMedia → (Episodes tab) ConfigureEpisode → AddSubtitle
 * (`01_gate_analyst_brief.md §5`).
 *
 * Goal: prove the fork-restored `DynamicDialogComponent` members that
 * `fixNestedDialogFocus` / `bindDocumentEscapeListener` depend on are present on
 * the LIVE dialog instance (the fork restore is what keeps nested dialogs from
 * silently breaking), and that opening the chain raises no NG0201.
 *
 * `fixNestedDialogFocus` reads, off `dialogService.dialogComponentRefMap.get(parent).instance`:
 *   unbindGlobalListeners / dialog.container() / moveOnTop / bindGlobalListeners /
 *   focus / maskViewChild / documentEscapeListener.
 * If the fork port dropped any, the nested path NPEs at runtime; here we assert
 * each member exists on the real instance.
 */

import { ApplicationRef, Renderer2, RendererFactory2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

import { provideAppConfigForTest } from '../app-config-test';
import { assertNoNgErrors } from '../console-error-guard';
import { fixNestedDialogFocus } from '../../app/core/utils/primeng-helper';
import { WsService } from '../../app/shared/modules/ws';
import { ConfigureMediaComponent } from '../../app/modules/admin/dialogs/configure-media/configure-media.component';
import { ConfigureEpisodeComponent } from '../../app/modules/admin/dialogs/configure-episode/configure-episode.component';
import { AddSubtitleComponent } from '../../app/modules/admin/dialogs/add-subtitle/add-subtitle.component';

const mediaDetails: any = {
  _id: 'm1', type: 'tv', title: 'Smoke', slug: 'smoke', externalStreams: {},
  runtime: 0, movie: { source: null, subtitles: [] }, tv: { episodes: [], lastAirDate: null }
};
const episode: any = { _id: 'e1', episodeNumber: 1, name: 'E1', media: 'm1', subtitles: [] };

/** Members fixNestedDialogFocus / bindDocumentEscapeListener read off the instance. */
const FORK_RESTORED_MEMBERS = [
  'unbindGlobalListeners',
  'moveOnTop',
  'bindGlobalListeners',
  'focus',
  'maskViewChild',
  'documentEscapeListener'
] as const;

describe('Runtime smoke: nested dialog chain (ConfigureMedia → ConfigureEpisode → AddSubtitle)', () => {
  let dialogService: DialogService;
  let appRef: ApplicationRef;
  let renderer: Renderer2;
  let refs: (DynamicDialogRef | null)[];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideAppConfigForTest() });
    dialogService = TestBed.inject(DialogService);
    appRef = TestBed.inject(ApplicationRef);
    renderer = TestBed.inject(RendererFactory2).createRenderer(null, null);
    // ConfigureMedia subscribes to wsService.fromEvent at construction; WsActivatorGuard
    // init() is the real precondition. Mirror it so the socket emitter exists.
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

  function open(component: any, data: unknown): DynamicDialogRef {
    const ref = dialogService.open(component, {
      data,
      autoZIndex: false,
      maskStyleClass: 'tw-z-[100]'
    });
    refs.push(ref);
    appRef.tick();
    // open() can return null in the fork; a smoke open must always mount.
    expect(ref).withContext(`${component?.name}: DialogService.open should return a ref`).toBeTruthy();
    return ref as DynamicDialogRef;
  }

  it('opens all three levels without NG0201', () => {
    const parent = open(ConfigureMediaComponent, { ...mediaDetails });
    const mid = open(ConfigureEpisodeComponent, { media: mediaDetails, episode });
    open(AddSubtitleComponent, { media: mediaDetails, episode, file: new File([''], 's.srt') });

    expect(dialogService.dialogComponentRefMap.size)
      .withContext('three dialog component refs should be tracked')
      .toBeGreaterThanOrEqual(3);

    // Exercise the actual focus-restore seam between the mid dialog and its parent.
    expect(() =>
      fixNestedDialogFocus(mid, parent, dialogService, renderer, document)
    ).not.toThrow();

    assertNoNgErrors();
  });

  it('exposes the fork-restored DynamicDialogComponent members on the live instance', () => {
    const parent = open(ConfigureMediaComponent, { ...mediaDetails });
    const instance = dialogService.dialogComponentRefMap.get(parent)?.instance;

    expect(instance)
      .withContext('parent DynamicDialogComponent instance must be tracked in dialogComponentRefMap')
      .toBeTruthy();

    for (const member of FORK_RESTORED_MEMBERS) {
      expect(member in (instance as object))
        .withContext(`fork-restored member "${member}" must exist on DynamicDialogComponent`)
        .toBeTrue();
    }
    // dialog.container() is the nested-focus restore gate.
    expect(typeof (instance as any).dialog?.container)
      .withContext('dialog.container() accessor must exist (fixNestedDialogFocus gate)')
      .toBe('function');

    assertNoNgErrors();
  });
});
