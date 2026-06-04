import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslocoService, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { DialogService } from 'primeng/dynamicdialog';

import { MediaListComponent } from './media-list.component';
import { AuthService } from '../../../core/services';
import { mockDialogService, mockRouter, mockTranslocoService } from '../../../../testing/test-helpers';

describe('MediaListComponent', () => {
  let component: MediaListComponent;
  let fixture: ComponentFixture<MediaListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MediaListComponent],
    providers: [
        { provide: Router, useValue: mockRouter() },
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: AuthService, useValue: { currentUser: null } }
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
