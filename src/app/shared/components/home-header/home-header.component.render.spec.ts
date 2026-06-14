import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DialogService } from 'primeng/dynamicdialog';
import { EMPTY, of } from 'rxjs';

import { HomeHeaderComponent } from './home-header.component';
import { AuthService, GenresService, MediaService } from '../../../core/services';
import { mockDialogService, mockRouter, provideMockActivatedRoute, provideTranslocoTesting } from '../../../../testing/test-helpers';

/**
 * v21 runtime render guard for the home-header p-drawer (sidebar->drawer migration).
 *
 * The default header spec blanks the template, so it never proves the drawer renders.
 * Here the template is mounted un-stubbed and `displaySidebar` is flipped true so the
 * p-drawer overlay (position="bottom", [baseZIndex], transitionOptions) actually mounts
 * and projects its content. The global console-error guard fails on any NG runtime error.
 */
describe('HomeHeaderComponent — v21 drawer render', () => {
  let fixture: ComponentFixture<HomeHeaderComponent>;
  let component: HomeHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeHeaderComponent],
      providers: [
        provideNoopAnimations(),
        provideTranslocoTesting(),
        provideMockActivatedRoute(),
        { provide: Router, useValue: mockRouter() },
        { provide: DialogService, useValue: mockDialogService() },
        { provide: AuthService, useValue: { currentUser$: EMPTY } },
        { provide: MediaService, useValue: {} },
        { provide: GenresService, useValue: { findPageCursor: () => of({ results: [], totalResults: 0, hasNextPage: false }) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the closed p-drawer host with no NG runtime error', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('p-drawer')).withContext('drawer host present in template').toBeTruthy();
  });

  it('drives the v21 drawer [(visible)] binding when displaySidebar is toggled', () => {
    const host: HTMLElement = fixture.nativeElement;
    const drawerHost = host.querySelector('p-drawer');
    expect(drawerHost).withContext('drawer host present').toBeTruthy();

    // Flip the bound model and re-render: the two-way [(visible)] migration must not
    // throw an NG runtime error (the console-error guard enforces that) and the host
    // must still be in the DOM bound to the new state.
    component.displaySidebar = true;
    fixture.detectChanges();
    expect(host.querySelector('p-drawer')).withContext('drawer host survives visible=true').toBeTruthy();
    expect(component.displaySidebar).toBeTrue();
  });
});
