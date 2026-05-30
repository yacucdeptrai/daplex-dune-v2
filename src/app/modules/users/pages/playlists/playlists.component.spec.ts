import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { AuthService } from '../../../../core/services';
import { PlaylistsComponent } from './playlists.component';
import { HTTP_TEST_PROVIDERS, mockRouter, mockTranslocoService, provideMockActivatedRoute } from '../../../../../testing/test-helpers';
import { Router } from '@angular/router';

describe('PlaylistsComponent', () => {
  let component: PlaylistsComponent;
  let fixture: ComponentFixture<PlaylistsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlaylistsComponent],
      providers: [
        provideMockActivatedRoute(),
        { provide: Router, useValue: mockRouter() },
        { provide: DialogService, useValue: { open: () => undefined, dialogComponentRefMap: new Map() } },
        { provide: ConfirmationService, useValue: {} },
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } },
        ...HTTP_TEST_PROVIDERS
      ]
    })
      .overrideComponent(PlaylistsComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(PlaylistsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
