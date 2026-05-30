import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { DialogService } from 'primeng/dynamicdialog';

import { PlaylistsComponent } from './playlists.component';
import { AuthService } from '../../../../core/services';
import {
  HTTP_TEST_PROVIDERS,
  provideMockActivatedRoute,
  mockRouter,
  mockDialogService,
  mockTranslocoService
} from '../../../../../testing/test-helpers';

describe('PlaylistsComponent', () => {
  let component: PlaylistsComponent;
  let fixture: ComponentFixture<PlaylistsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlaylistsComponent],
      providers: [
        ...HTTP_TEST_PROVIDERS,
        provideMockActivatedRoute({ params: {} }),
        { provide: Router, useValue: mockRouter() },
        { provide: DialogService, useValue: mockDialogService() },
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: AuthService, useValue: {} }
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
