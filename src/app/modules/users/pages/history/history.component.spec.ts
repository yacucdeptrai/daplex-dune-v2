import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { AuthService, ConfirmActionService, GenresService, MediaService } from '../../../../core/services';
import { HistoryComponent } from './history.component';
import { HTTP_TEST_PROVIDERS, mockTranslocoService, provideMockActivatedRoute } from '../../../../../testing/test-helpers';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [HistoryComponent],
    providers: [
        provideMockActivatedRoute(),
        { provide: TranslocoService, useValue: { ...mockTranslocoService(), selectTranslation: () => of({}) } },
        { provide: DialogService, useValue: { open: () => undefined, dialogComponentRefMap: new Map() } },
        { provide: ConfirmationService, useValue: {} },
        ConfirmActionService,
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } },
        { provide: GenresService, useValue: {} },
        { provide: MediaService, useValue: {} },
        ...HTTP_TEST_PROVIDERS
    ]
})
      .overrideComponent(HistoryComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.filterHistoryForm).toBeTruthy();
  });
});
