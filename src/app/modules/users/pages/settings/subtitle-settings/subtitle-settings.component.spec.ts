import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { of } from 'rxjs';

import { AuthService, UsersService } from '../../../../../core/services';
import { SubtitleSettingsComponent } from './subtitle-settings.component';
import { mockTranslocoService } from '../../../../../../testing/test-helpers';

describe('SubtitleSettingsComponent', () => {
  let component: SubtitleSettingsComponent;
  let fixture: ComponentFixture<SubtitleSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SubtitleSettingsComponent],
      providers: [
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } },
        { provide: UsersService, useValue: {} }
      ]
    })
      .overrideComponent(SubtitleSettingsComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(SubtitleSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.updateSubtitleForm).toBeTruthy();
  });
});
