import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslocoService, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { DialogService } from 'primeng/dynamicdialog';

import { MediaListComponent } from './media-list.component';
import { AuthService, WatchProgressService } from '../../../core/services';
import { Media } from '../../../core/models';
import { APP_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER } from '../../directives/overlay-panel/overlay-panel/overlay-panel.directive';
import { mockDialogService, mockRouter, mockTranslocoService, provideTranslocoTesting } from '../../../../testing/test-helpers';

describe('MediaListComponent', () => {
  let component: MediaListComponent;
  let fixture: ComponentFixture<MediaListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MediaListComponent],
    providers: [
        { provide: Router, useValue: mockRouter() },
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: AuthService, useValue: { currentUser: null } },
        { provide: WatchProgressService, useValue: { progressFor: () => null } }
    ]
})
      // DialogService is a component-level provider; replace the whole provider set and blank
      // the template in the SAME `set` (mixing `set` with `add`/`remove` is not allowed).
      .overrideComponent(MediaListComponent, {
        set: {
          template: '',
          providers: [
            { provide: DialogService, useValue: mockDialogService() },
            { provide: TRANSLOCO_SCOPE, useValue: 'media' }
          ]
        }
      })
      .compileComponents();
    fixture = TestBed.createComponent(MediaListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('MediaListComponent progress overlay (W2.2)', () => {
  const media = (id: string): Media =>
    ({ _id: id, title: `T-${id}`, runtime: 100, releaseDate: { year: 2020 }, type: 1 } as unknown as Media);

  async function render(progress: Record<string, number | null>) {
    const progressFor = jasmine.createSpy('progressFor').and.callFake((id: string) => progress[id] ?? null);

    await TestBed.configureTestingModule({
      imports: [MediaListComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        APP_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER,
        { provide: AuthService, useValue: { currentUser: { _id: 'u1' } } },
        { provide: WatchProgressService, useValue: { progressFor } },
        // Real nested media tree so the aria-label key RESOLVES to text (not the raw key).
        ...provideTranslocoTesting({ media: { actions: { watchProgress: 'Watch progress' } } })
      ]
    })
      .overrideComponent(MediaListComponent, {
        set: { providers: [{ provide: DialogService, useValue: mockDialogService() }, { provide: TRANSLOCO_SCOPE, useValue: 'media' }] }
      })
      .compileComponents();

    // Load translations before first detectChanges so resolved text (not the raw key) renders.
    await TestBed.inject(TranslocoService).load('en').toPromise();

    const fixture = TestBed.createComponent(MediaListComponent);
    fixture.componentInstance.viewMode = 1;
    fixture.componentInstance.mediaList = [media('m1'), media('m2')];
    fixture.detectChanges();
    return fixture;
  }

  it('renders a progress bar only for the in-progress poster, with the resolved aria-label and percent', async () => {
    const fixture = await render({ m1: 42, m2: null });
    const bars = fixture.nativeElement.querySelectorAll('p-progressbar');
    // Exactly one overlay: m1 has progress, m2 does not.
    expect(bars.length).toBe(1);
    // aria-label must be the RESOLVED text, not the raw key (the W2.1 regression).
    expect(bars[0].getAttribute('aria-label')).toBe('Watch progress');
    expect(bars[0].textContent).toContain('42');
  });

  it('renders no overlay when no poster has progress', async () => {
    const fixture = await render({ m1: null, m2: null });
    expect(fixture.nativeElement.querySelectorAll('p-progressbar').length).toBe(0);
  });
});
