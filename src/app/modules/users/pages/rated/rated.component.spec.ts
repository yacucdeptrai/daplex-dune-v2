import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { AuthService, ConfirmActionService } from '../../../../core/services';
import { RatedComponent } from './rated.component';
import { HTTP_TEST_PROVIDERS, mockRouter, mockTranslocoService, provideMockActivatedRoute } from '../../../../../testing/test-helpers';

describe('RatedComponent', () => {
  let component: RatedComponent;
  let fixture: ComponentFixture<RatedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [RatedComponent],
    providers: [
        provideMockActivatedRoute(),
        { provide: Router, useValue: mockRouter() },
        { provide: DialogService, useValue: { open: () => undefined, dialogComponentRefMap: new Map() } },
        { provide: ConfirmationService, useValue: {} },
        ConfirmActionService,
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } },
        ...HTTP_TEST_PROVIDERS
    ]
})
      .overrideComponent(RatedComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(RatedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
