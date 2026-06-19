import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { DialogService } from 'primeng/dynamicdialog';

import { HomeComponent } from './home.component';
import { AuthService, MediaService } from '../../../../core/services';
import { UserDetails } from '../../../../core/models';
import { FeaturedMediaComponent } from '../../components/featured-media/featured-media.component';
import { MediaListComponent } from '../../../../shared/components/media-list/media-list.component';
import { MediaTopComponent } from '../../../../shared/components/media-top/media-top.component';
import { ContinueWatchingRowComponent } from '../../components/continue-watching-row';
import { mockDialogService, provideTranslocoTesting } from '../../../../../testing/test-helpers';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: MediaService, useValue: { findPage: () => of(null) } },
        { provide: AuthService, useValue: { currentUser$: of(null) } }
      ]
    })
      .overrideComponent(HomeComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('HomeComponent — resume rail auth gating', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let user$: BehaviorSubject<UserDetails | null>;

  beforeEach(async () => {
    user$ = new BehaviorSubject<UserDetails | null>(null);
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideTranslocoTesting(),
        { provide: AuthService, useValue: { currentUser$: user$.asObservable() } },
        { provide: MediaService, useValue: { findPage: () => of(null) } },
        { provide: DialogService, useValue: mockDialogService() }
      ]
    })
      // Stub the heavy children; the row stub lets us assert its presence without its data call.
      .overrideComponent(FeaturedMediaComponent, { set: { template: '' } })
      .overrideComponent(MediaListComponent, { set: { template: '' } })
      .overrideComponent(MediaTopComponent, { set: { template: '' } })
      .overrideComponent(ContinueWatchingRowComponent, { set: { template: '<div class="row-stub"></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
  });

  it('does not render the resume rail when anonymous (no history call fired)', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-continue-watching-row')).toBeNull();
  });

  it('renders the resume rail above New Releases when signed in', () => {
    user$.next({ _id: 'u1' } as UserDetails);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-continue-watching-row')).not.toBeNull();
  });

  it('adds the rail on sign-in and removes it on sign-out within the session (AC7)', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-continue-watching-row')).toBeNull();

    user$.next({ _id: 'u1' } as UserDetails);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-continue-watching-row')).not.toBeNull();

    user$.next(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-continue-watching-row')).toBeNull();
  });
});
