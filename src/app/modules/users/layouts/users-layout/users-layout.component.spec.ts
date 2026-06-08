import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';

import { AuthService, UsersService } from '../../../../core/services';
import { UsersLayoutComponent } from './users-layout.component';
import { mockTranslocoService, provideMockActivatedRoute } from '../../../../../testing/test-helpers';

describe('UsersLayoutComponent', () => {
  let component: UsersLayoutComponent;
  let fixture: ComponentFixture<UsersLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [UsersLayoutComponent],
    providers: [
        provideMockActivatedRoute(),
        { provide: TranslocoService, useValue: { ...mockTranslocoService(), selectTranslation: () => of({}) } },
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } },
        { provide: UsersService, useValue: {} }
    ]
})
      .overrideComponent(UsersLayoutComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(UsersLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
