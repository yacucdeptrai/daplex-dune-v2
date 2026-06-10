import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { of, Subject } from 'rxjs';

import { ConfigureMediaEpisodesComponent } from './configure-media-episodes.component';
import { ConfirmActionService, MediaService, QueueUploadService } from '../../../../../../core/services';
import { AppErrorCode, MediaSourceStatus, MediaStatus, MediaType } from '../../../../../../core/enums';
import { UPLOAD_SUBTITLE_SIZE } from '../../../../../../../environments/config';
import { mockDialogService, mockDynamicDialogRef, mockTranslocoService } from '../../../../../../../testing/test-helpers';

/**
 * Characterization tests for the extracted ConfigureMediaEpisodesComponent (TV episode list +
 * per-episode menu + create/configure/delete/add-subtitle/add-source nested dialogs). Re-homed from
 * the parent spec's `episodes concern` block; assertions are unchanged, only the receiver is adapted:
 * behavior is driven through signal inputs (media/t/parentDialogRef) + service spies, never rendered
 * DOM. Beyond the moved behavior, these prove the NG0201-relevant DI — the child injects the
 * route-scoped DialogService / ConfirmActionService / QueueUploadService from the surrounding injector
 * tree (never re-provided in the child's own `providers`), exactly as it would inside the dialog.
 *
 * These assert WHAT THE CODE DID pre-split, re-homed to the child: `config.data!._id` -> `media()._id`,
 * the add-subtitle onClose `this.media =` mutation -> immutable `mediaChange.emit`, and `episodes`
 * seeded from `media().tv.episodes` on init (HAZARD-3 design A). The shared <p-confirmDialog
 * key="inModal"> element stays in the parent; `parentDialogRef` feeds fixNestedDialogFocus.
 */

const MEDIA_ID = 'm1';
const MEDIA_TITLE = 'Test Media';

/** Minimal TV-shaped MediaDetails with episodes, sufficient for the Episodes handlers. */
function makeTvMedia(episodes: any[] = [{ _id: 'ep1', epNumber: 1, status: MediaSourceStatus.PENDING }]): any {
  return {
    _id: MEDIA_ID, type: MediaType.TV, title: MEDIA_TITLE,
    status: MediaStatus.RELEASED,
    movie: { status: MediaSourceStatus.DONE, subtitles: [] },
    tv: { episodes, lastAirDate: { day: 1, month: 1, year: 2021 } }
  };
}

describe('ConfigureMediaEpisodesComponent', () => {
  let component: ConfigureMediaEpisodesComponent;
  let fixture: ComponentFixture<ConfigureMediaEpisodesComponent>;
  let mediaService: any;
  let dialogService: any;
  let queueUploadService: any;
  let confirmationService: ConfirmationService;

  function create(media: any = makeTvMedia(), inQueue: boolean = false) {
    mediaService = {
      findAllTVEpisodes: jasmine.createSpy('findAllTVEpisodes').and.returnValue(of([])),
      deleteTVEpisode: jasmine.createSpy('deleteTVEpisode').and.returnValue(of(undefined))
    };
    queueUploadService = {
      isMediaInQueue: jasmine.createSpy('isMediaInQueue').and.returnValue(inQueue),
      addToQueue: jasmine.createSpy('addToQueue')
    };

    return TestBed.configureTestingModule({
      imports: [ConfigureMediaEpisodesComponent],
      providers: [
        { provide: DialogService, useValue: mockDialogService() },
        // Route-scoped tokens supplied by the surrounding injector, never by the child itself.
        ConfirmationService,
        ConfirmActionService,
        { provide: MediaService, useValue: mediaService },
        { provide: QueueUploadService, useValue: queueUploadService },
        { provide: TranslocoService, useValue: { ...mockTranslocoService(), selectTranslation: () => of({}) } }
      ]
    })
      .overrideComponent(ConfigureMediaEpisodesComponent, { set: { template: '', imports: [] } })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(ConfigureMediaEpisodesComponent);
        component = fixture.componentInstance;
        dialogService = TestBed.inject(DialogService) as any;
        confirmationService = TestBed.inject(ConfirmationService);
        fixture.componentRef.setInput('media', media);
        fixture.componentRef.setInput('t', (key: string) => key);
        fixture.componentRef.setInput('parentDialogRef', mockDynamicDialogRef());
        fixture.detectChanges();
      });
  }

  function setTranslations() {
    const transloco = TestBed.inject(TranslocoService) as any;
    transloco.selectTranslation = () => of({
      'configureMedia.addSubtitle': 'Add Subtitle',
      'configureMedia.addSource': 'Add Source',
      'configureMedia.deleteEpisode': 'Delete Episode'
    });
  }

  // 1. create / DI + seeding -----------------------------------------------------------

  it('should create (injects route-scoped ConfirmActionService/QueueUploadService/DialogService without NG0201)', async () => {
    await create();
    expect(component).toBeTruthy();
  });

  it('seeds episodes from media().tv.episodes on init', async () => {
    await create(makeTvMedia([{ _id: 'epSeed', epNumber: 1, status: MediaSourceStatus.PENDING }]));
    expect(component.episodes).toEqual([{ _id: 'epSeed', epNumber: 1, status: MediaSourceStatus.PENDING }] as any);
  });

  // 2. loadEpisodes --------------------------------------------------------------------

  it('loadEpisodes fetches episodes with includeHidden/includeUnprocessed and sets episodes + toggles loadingEpisodes', async () => {
    await create();
    mediaService.findAllTVEpisodes.and.returnValue(of([{ _id: 'epA' }, { _id: 'epB' }]));
    component.loadEpisodes();
    expect(mediaService.findAllTVEpisodes).toHaveBeenCalledWith(
      MEDIA_ID, { includeHidden: true, includeUnprocessed: true });
    expect(component.episodes).toEqual([{ _id: 'epA' }, { _id: 'epB' }] as any);
    expect(component.loadingEpisodes).toBeFalse(); // reset in .add() after sync emission
  });

  it('loadEpisodes(false) does not toggle loadingEpisodes', async () => {
    await create();
    const subject = new Subject<any>();
    mediaService.findAllTVEpisodes.and.returnValue(subject.asObservable());
    component.loadingEpisodes = false;
    component.loadEpisodes(false);
    expect(component.loadingEpisodes).toBeFalse();
    subject.next([]); subject.complete();
    expect(component.loadingEpisodes).toBeFalse();
  });

  // 3. showCreateEpisodeDialog ---------------------------------------------------------

  it('showCreateEpisodeDialog opens CreateEpisodeComponent with media + episodes; onClose pushes the new episode and emits updated', async () => {
    await create();
    const ref = mockDynamicDialogRef();
    ref.onClose = of({ _id: 'epNew', epNumber: 2 }) as any;
    dialogService.open.and.returnValue(ref);
    let updated = false;
    component.updated.subscribe(() => (updated = true));
    component.showCreateEpisodeDialog();
    const [, cfg] = dialogService.open.calls.mostRecent().args;
    expect(cfg.data.media._id).toBe(MEDIA_ID);
    expect(Array.isArray(cfg.data.episodes)).toBeTrue();
    expect(component.episodes!.some(e => e._id === 'epNew')).toBeTrue();
    expect(updated).toBeTrue();
  });

  it('showCreateEpisodeDialog onClose with no episode does not push or emit updated', async () => {
    await create();
    const ref = mockDynamicDialogRef();
    ref.onClose = of(undefined) as any;
    dialogService.open.and.returnValue(ref);
    let updated = false;
    component.updated.subscribe(() => (updated = true));
    const before = component.episodes!.length;
    component.showCreateEpisodeDialog();
    expect(component.episodes!.length).toBe(before);
    expect(updated).toBeFalse();
  });

  it('showCreateEpisodeDialog is a no-op when episodes is undefined', async () => {
    await create();
    component.episodes = undefined;
    component.showCreateEpisodeDialog();
    expect(dialogService.open).not.toHaveBeenCalled();
  });

  // 4. showConfigureEpisodeDialog ------------------------------------------------------

  it('showConfigureEpisodeDialog opens ConfigureEpisodeComponent; onClose(updated) reloads episodes', async () => {
    await create();
    const ref = mockDynamicDialogRef();
    ref.onClose = of(true) as any;
    dialogService.open.and.returnValue(ref);
    mediaService.findAllTVEpisodes.and.returnValue(of([{ _id: 'epReloaded' }]));
    component.showConfigureEpisodeDialog({ _id: 'ep1' } as any);
    const [, cfg] = dialogService.open.calls.mostRecent().args;
    expect(cfg.data.media._id).toBe(MEDIA_ID);
    expect(cfg.data.episode._id).toBe('ep1');
    expect(mediaService.findAllTVEpisodes).toHaveBeenCalled();
    expect(component.episodes).toEqual([{ _id: 'epReloaded' }] as any);
  });

  it('showConfigureEpisodeDialog onClose(falsy) does NOT reload episodes', async () => {
    await create();
    const ref = mockDynamicDialogRef();
    ref.onClose = of(false) as any;
    dialogService.open.and.returnValue(ref);
    mediaService.findAllTVEpisodes.calls.reset();
    component.showConfigureEpisodeDialog({ _id: 'ep1' } as any);
    expect(mediaService.findAllTVEpisodes).not.toHaveBeenCalled();
  });

  // 5. showDeleteEpisodeDialog / deleteEpisode -----------------------------------------

  it('showDeleteEpisodeDialog confirms with key:"inModal" and the delete-episode header, accept deletes + reloads', async () => {
    await create();
    const confirmSpy = spyOn(confirmationService, 'confirm');
    mediaService.findAllTVEpisodes.and.returnValue(of([]));
    component.showDeleteEpisodeDialog({ _id: 'ep1', epNumber: 1 } as any);
    const arg = confirmSpy.calls.mostRecent().args[0];
    expect(arg.key).toBe('inModal');
    expect(arg.header).toBe('admin.media.deleteEpisodeConfirmationHeader');
    expect(typeof arg.accept).toBe('function');
    arg.accept!();
    expect(mediaService.deleteTVEpisode).toHaveBeenCalledWith(MEDIA_ID, 'ep1');
    expect(mediaService.findAllTVEpisodes).toHaveBeenCalled();
  });

  it('deleteEpisode sets loadingEpisodes true, deletes, then reloads episodes', async () => {
    await create();
    mediaService.findAllTVEpisodes.and.returnValue(of([{ _id: 'epAfter' }]));
    component.deleteEpisode({ _id: 'ep1' } as any);
    expect(mediaService.deleteTVEpisode).toHaveBeenCalledWith(MEDIA_ID, 'ep1');
    expect(component.episodes).toEqual([{ _id: 'epAfter' }] as any);
  });

  // 6. showAddSubtitleDialog -----------------------------------------------------------

  it('showAddSubtitleDialog throws UPLOAD_SUBTITLE_TOO_LARGE when the file exceeds the size limit', async () => {
    await create();
    const big = { size: UPLOAD_SUBTITLE_SIZE + 1 } as File;
    expect(() => component.showAddSubtitleDialog(big)).toThrowError(AppErrorCode.UPLOAD_SUBTITLE_TOO_LARGE);
  });

  it('showAddSubtitleDialog opens AddSubtitleComponent and emits mediaChange with subtitles merged into movie.subtitles immutably', async () => {
    await create();
    const ref = mockDynamicDialogRef();
    const subs = [{ _id: 'sub1' }] as any;
    ref.onClose = of(subs) as any;
    dialogService.open.and.returnValue(ref);
    const prev = component.media();
    let merged: any;
    component.mediaChange.subscribe(m => (merged = m));
    component.showAddSubtitleDialog(undefined, { _id: 'ep1' } as any);
    const [, cfg] = dialogService.open.calls.mostRecent().args;
    expect(cfg.data.media._id).toBe(MEDIA_ID);
    expect(cfg.data.episode._id).toBe('ep1');
    expect(merged.movie.subtitles).toBe(subs);
    expect(merged).not.toBe(prev); // immutable replacement bubbled up
    expect(prev.movie.subtitles).not.toBe(subs); // input not mutated in place
  });

  // 7. showAddSourceDialog -------------------------------------------------------------

  it('showAddSourceDialog opens AddSourceComponent with media (+ optional episode) and does not throw', async () => {
    await create();
    component.showAddSourceDialog({ _id: 'ep1' } as any);
    const [, cfg] = dialogService.open.calls.mostRecent().args;
    expect(cfg.data.media._id).toBe(MEDIA_ID);
    expect(cfg.data.episode._id).toBe('ep1');
  });

  // 8. createEpisodeMenuItem -----------------------------------------------------------

  it('createEpisodeMenuItem builds 4 menu items (add subtitle, add source, separator, delete episode)', async () => {
    await create();
    setTranslations();
    const episode = { _id: 'ep1', epNumber: 1, status: MediaSourceStatus.PENDING } as any;
    let items: any[] = [];
    component.createEpisodeMenuItem(episode).subscribe(i => (items = i));
    expect(items.length).toBe(4);
    expect(items.some(i => i.separator)).toBeTrue();
    expect(items.filter(i => !i.separator).length).toBe(3);
  });

  it('createEpisodeMenuItem disables Add Source when episode.status !== PENDING', async () => {
    await create();
    setTranslations();
    let items: any[] = [];
    component.createEpisodeMenuItem({ _id: 'ep1', epNumber: 1, status: MediaSourceStatus.DONE } as any)
      .subscribe(i => (items = i));
    const addSource = items.find(i => i.label === 'Add Source');
    expect(addSource.disabled).toBeTrue();
  });

  it('createEpisodeMenuItem disables Add Source when the episode is already in the upload queue (id:epId)', async () => {
    await create();
    setTranslations();
    queueUploadService.isMediaInQueue.and.returnValue(true);
    let items: any[] = [];
    component.createEpisodeMenuItem({ _id: 'ep1', epNumber: 1, status: MediaSourceStatus.PENDING } as any)
      .subscribe(i => (items = i));
    expect(queueUploadService.isMediaInQueue).toHaveBeenCalledWith(`${MEDIA_ID}:ep1`);
    const addSource = items.find(i => i.label === 'Add Source');
    expect(addSource.disabled).toBeTrue();
  });

  it('createEpisodeMenuItem enables Add Source when episode is PENDING and not in the queue', async () => {
    await create();
    setTranslations();
    queueUploadService.isMediaInQueue.and.returnValue(false);
    let items: any[] = [];
    component.createEpisodeMenuItem({ _id: 'ep1', epNumber: 1, status: MediaSourceStatus.PENDING } as any)
      .subscribe(i => (items = i));
    const addSource = items.find(i => i.label === 'Add Source');
    expect(addSource.disabled).toBeFalse();
  });

  // Menu command wiring: the Add Subtitle / Add Source / Delete commands invoke the openers.
  it('createEpisodeMenuItem commands invoke showAddSubtitleDialog / showAddSourceDialog / showDeleteEpisodeDialog', async () => {
    await create();
    setTranslations();
    const addSub = spyOn(component, 'showAddSubtitleDialog');
    const addSrc = spyOn(component, 'showAddSourceDialog');
    const del = spyOn(component, 'showDeleteEpisodeDialog');
    const episode = { _id: 'ep1', epNumber: 1, status: MediaSourceStatus.PENDING } as any;
    let items: any[] = [];
    component.createEpisodeMenuItem(episode).subscribe(i => (items = i));
    items.find(i => i.label === 'Add Subtitle').command({ item: { data: episode } });
    items.find(i => i.label === 'Add Source').command({ item: { data: episode } });
    items.find(i => i.label === 'Delete Episode').command({ item: { data: episode } });
    expect(addSub).toHaveBeenCalledWith(undefined, episode);
    expect(addSrc).toHaveBeenCalledWith(episode);
    expect(del).toHaveBeenCalledWith(episode);
  });

  // 9. toggleEpisodeMenu ---------------------------------------------------------------

  it('toggleEpisodeMenu (menu hidden) builds episodeMenuItems then toggles the menu', async () => {
    await create();
    setTranslations();
    const menu = { visible: false, toggle: jasmine.createSpy('toggle') } as any;
    const event = {} as Event;
    component.episodeMenuItems = [];
    component.toggleEpisodeMenu(menu, event, { _id: 'ep1', epNumber: 1, status: MediaSourceStatus.PENDING } as any);
    expect(component.episodeMenuItems.length).toBe(4);
    expect(menu.toggle).toHaveBeenCalledWith(event);
  });

  it('toggleEpisodeMenu (menu already visible) just toggles without rebuilding items', async () => {
    await create();
    const menu = { visible: true, toggle: jasmine.createSpy('toggle') } as any;
    const event = {} as Event;
    const existing = [{ label: 'kept' }] as any;
    component.episodeMenuItems = existing;
    component.toggleEpisodeMenu(menu, event, { _id: 'ep1', epNumber: 1, status: MediaSourceStatus.PENDING } as any);
    expect(component.episodeMenuItems).toBe(existing); // not rebuilt
    expect(menu.toggle).toHaveBeenCalledWith(event);
  });
});
