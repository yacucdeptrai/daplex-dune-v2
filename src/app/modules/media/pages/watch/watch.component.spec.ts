import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { TranslocoService } from '@ngneat/transloco';
import { DialogService } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { WatchComponent } from './watch.component';
import { AuthService, MediaService } from '../../../../core/services';
import {
  HTTP_TEST_PROVIDERS,
  provideMockActivatedRoute,
  mockRouter,
  mockDialogService,
  mockTranslocoService
} from '../../../../../testing/test-helpers';

describe('WatchComponent', () => {
  let component: WatchComponent;
  let fixture: ComponentFixture<WatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WatchComponent],
      providers: [
        ...HTTP_TEST_PROVIDERS,
        provideMockActivatedRoute({ params: {}, queryParams: {} }),
        { provide: Router, useValue: mockRouter() },
        { provide: BreakpointObserver, useValue: { observe: () => of({ matches: false, breakpoints: {} }) } },
        { provide: Location, useValue: { replaceState: () => undefined } },
        { provide: DialogService, useValue: mockDialogService() },
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: AuthService, useValue: { currentUser$: of(null) } },
        { provide: MediaService, useValue: {} }
      ]
    })
      .overrideComponent(WatchComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(WatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
