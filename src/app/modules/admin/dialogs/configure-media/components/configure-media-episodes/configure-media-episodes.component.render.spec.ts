import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { Menu } from 'primeng/menu';
import { of } from 'rxjs';

import { ConfigureMediaEpisodesComponent } from './configure-media-episodes.component';
import { ConfirmActionService, MediaService, QueueUploadService } from '../../../../../../core/services';
import { MediaSourceStatus, MediaStatus, MediaType, MediaPStatus } from '../../../../../../core/enums';
import { mockDialogService, mockDynamicDialogRef, mockTranslocoService } from '../../../../../../../testing/test-helpers';

/**
 * HAZARD-1 RENDER verification — adopted as a permanent guard.
 *
 * The root <p-menu #episodeMenu> template-ref, its [model] binding, and the
 * toggleEpisodeMenu(episodeMenu, ...) call-site all moved from the parent into this child
 * (component html). A dangling cross-component template-ref compiles green and unit-tests
 * green (the unit spec stubs the template with `template: ''`), then breaks at runtime.
 *
 * Unlike the unit spec, this mounts the REAL template (no override), renders a TV media's
 * episode table, clicks the per-episode "more" button, and asserts the menu actually opens:
 * the #episodeMenu ref resolves to a real PrimeNG Menu instance, toggle flips overlayVisible,
 * and the three menu items render in the DOM. provideNoopAnimations makes the overlay's
 * animation resolve synchronously so the popup DOM materializes deterministically in
 * ChromeHeadless. This is the live-render proof AOT/unit-stub evidence cannot give.
 */

const MEDIA_ID = 'm1';

function makeTvMedia(): any {
  return {
    _id: MEDIA_ID, type: MediaType.TV, title: 'Render QA Media',
    status: MediaStatus.RELEASED,
    movie: { status: MediaSourceStatus.DONE, subtitles: [] },
    tv: {
      lastAirDate: { day: 1, month: 1, year: 2021 },
      episodes: [
        { _id: 'ep1', epNumber: 1, name: 'Pilot', runtime: 1200, airDate: { day: 1, month: 1, year: 2021 }, status: MediaSourceStatus.PENDING, pStatus: MediaPStatus.PENDING }
      ]
    }
  };
}

describe('ConfigureMediaEpisodesComponent — HAZARD-1 live menu render', () => {
  let fixture: ComponentFixture<ConfigureMediaEpisodesComponent>;
  let component: ConfigureMediaEpisodesComponent;

  beforeEach(async () => {
    const mediaService = {
      findAllTVEpisodes: jasmine.createSpy('findAllTVEpisodes').and.returnValue(of([])),
      deleteTVEpisode: jasmine.createSpy('deleteTVEpisode').and.returnValue(of(undefined))
    };
    const queueUploadService = {
      isMediaInQueue: jasmine.createSpy('isMediaInQueue').and.returnValue(false),
      addToQueue: jasmine.createSpy('addToQueue')
    };

    await TestBed.configureTestingModule({
      // Real component, REAL template (no overrideComponent stub) — this is the point.
      imports: [ConfigureMediaEpisodesComponent],
      providers: [
        provideNoopAnimations(),
        { provide: DialogService, useValue: mockDialogService() },
        // Route-scoped tokens supplied by the surrounding injector, never re-provided by the child.
        ConfirmationService,
        ConfirmActionService,
        { provide: MediaService, useValue: mediaService },
        { provide: QueueUploadService, useValue: queueUploadService },
        {
          provide: TranslocoService,
          useValue: {
            ...mockTranslocoService(),
            // createEpisodeMenuItem reads the 3 labels off selectTranslation('admin').
            selectTranslation: () => of({
              'configureMedia.addSubtitle': 'Add Subtitle',
              'configureMedia.addSource': 'Add Source',
              'configureMedia.deleteEpisode': 'Delete Episode'
            })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigureMediaEpisodesComponent);
    component = fixture.componentInstance;
    // t() is a passthrough translate fn; real template binds t()('key').
    fixture.componentRef.setInput('media', makeTvMedia());
    fixture.componentRef.setInput('t', (key: string) => key);
    fixture.componentRef.setInput('parentDialogRef', mockDynamicDialogRef());
    fixture.detectChanges();
  });

  it('renders the episode table and the #episodeMenu p-menu element from the real template', () => {
    const host: HTMLElement = fixture.nativeElement;
    // The per-episode "more" trigger renders (proves the moved table template compiled + bound).
    const moreBtn = host.querySelector('button.p-button-secondary.p-button-sm-icon') as HTMLButtonElement;
    expect(moreBtn).withContext('per-episode "more" button should render').toBeTruthy();
    // The <p-menu #episodeMenu> host element renders in the child template (not dangling in the parent).
    const menuHost = host.querySelector('p-menu');
    expect(menuHost).withContext('<p-menu #episodeMenu> must render inside the child template').toBeTruthy();
  });

  it('resolves #episodeMenu to a real PrimeNG Menu instance (template-ref move is intact, not dangling)', () => {
    // The call-site toggleEpisodeMenu(episodeMenu, ...) passes the template-ref var. If the ref
    // had been left dangling in the parent, this query would find no Menu in the child view.
    const menuDe = fixture.debugElement.query(
      (de: any) => de.componentInstance instanceof Menu
    );
    expect(menuDe).withContext('a real PrimeNG Menu component must exist in the child view').toBeTruthy();
    expect(menuDe.componentInstance instanceof Menu).toBeTrue();
  });

  it('opens the per-episode menu on "more" click: overlayVisible flips and the 3 items render in the DOM', fakeAsync(() => {
    const host: HTMLElement = fixture.nativeElement;
    const moreBtn = host.querySelector('button.p-button-secondary.p-button-sm-icon') as HTMLButtonElement;
    expect(moreBtn).toBeTruthy();

    const menuDe = fixture.debugElement.query((de: any) => de.componentInstance instanceof Menu);
    const menu = menuDe.componentInstance as Menu;
    expect(menu.overlayVisible).withContext('menu starts closed').toBeFalsy();

    // Real click on the rendered trigger -> (click)="toggleEpisodeMenu(episodeMenu, $event, episode)".
    moreBtn.click();
    fixture.detectChanges();
    tick();                 // let createEpisodeMenuItem's selectTranslation().pipe(first()) settle
    fixture.detectChanges();
    flush();                // flush the NoopAnimations overlay animation -> appendOverlay()
    fixture.detectChanges();

    // The menu is now open (toggle -> show -> overlayVisible = true).
    expect(menu.overlayVisible).withContext('menu must open after clicking "more"').toBeTrue();

    // The 3 built items are bound into the menu model (add subtitle / add source / delete).
    const nonSeparator = (component.episodeMenuItems || []).filter((i: any) => !i.separator);
    expect(nonSeparator.length).withContext('3 actionable items bound to the menu model').toBe(3);

    // The overlay items render in the DOM (appendTo="body" -> overlay lives at document.body).
    // v21 renamed the menu-item classes: .p-menuitem-link/.p-menuitem-text -> .p-menu-item-link/.p-menu-item-label.
    const links = document.querySelectorAll('.p-menu-item-link, .p-menu-item-label');
    expect(links.length).withContext('menu item DOM should render in the body overlay').toBeGreaterThan(0);
    const text = (document.body.textContent || '');
    expect(text).toContain('Add Subtitle');
    expect(text).toContain('Add Source');
    expect(text).toContain('Delete Episode');

    // Close to clean up the body overlay between specs.
    menu.hide();
    fixture.detectChanges();
    flush();
  }));

  afterEach(() => {
    // Defensive: PrimeNG popup appends to body; remove any stray overlay so specs don't bleed.
    document.querySelectorAll('.p-menu').forEach(n => {
      if (n.parentElement === document.body) n.remove();
    });
  });
});
