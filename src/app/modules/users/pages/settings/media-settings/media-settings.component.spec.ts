import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { of } from 'rxjs';

import { AuthService, UsersService } from '../../../../../core/services';
import { MediaSettingsComponent } from './media-settings.component';
import { mockTranslocoService } from '../../../../../../testing/test-helpers';

describe('MediaSettingsComponent', () => {
  let component: MediaSettingsComponent;
  let fixture: ComponentFixture<MediaSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MediaSettingsComponent],
    providers: [
        { provide: TranslocoService, useValue: { ...mockTranslocoService(), selectTranslation: () => of({}) } },
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } },
        { provide: UsersService, useValue: {} }
    ]
})
      .overrideComponent(MediaSettingsComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(MediaSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.updateMediaForm).toBeTruthy();
  });
});
