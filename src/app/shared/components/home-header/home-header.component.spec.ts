import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { EMPTY, of } from 'rxjs';

import { HomeHeaderComponent } from './home-header.component';
import { AuthService, GenresService, MediaService } from '../../../core/services';
import { mockDialogService, mockRouter } from '../../../../testing/test-helpers';

describe('HomeHeaderComponent', () => {
  let component: HomeHeaderComponent;
  let fixture: ComponentFixture<HomeHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeHeaderComponent],
      providers: [
        { provide: Router, useValue: mockRouter() },
        { provide: DialogService, useValue: mockDialogService() },
        { provide: AuthService, useValue: { currentUser$: EMPTY } },
        { provide: MediaService, useValue: {} },
        {
          provide: GenresService,
          useValue: { findPageCursor: () => of({ results: [], totalResults: 0, hasNextPage: false }) }
        }
      ]
    })
      .overrideComponent(HomeHeaderComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(HomeHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
