import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService, DestroyService } from '../../../../core/services';
import { HistoryCardComponent } from './history-card.component';
import { provideMockActivatedRoute } from '../../../../../testing/test-helpers';

describe('HistoryCardComponent', () => {
  let component: HistoryCardComponent;
  let fixture: ComponentFixture<HistoryCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [HistoryCardComponent],
    providers: [
        provideMockActivatedRoute(),
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } },
        DestroyService
    ]
})
      .overrideComponent(HistoryCardComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(HistoryCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
