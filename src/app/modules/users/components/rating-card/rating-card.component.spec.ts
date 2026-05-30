import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService, DestroyService } from '../../../../core/services';
import { RatingCardComponent } from './rating-card.component';
import { provideMockActivatedRoute } from '../../../../../testing/test-helpers';

describe('RatingCardComponent', () => {
  let component: RatingCardComponent;
  let fixture: ComponentFixture<RatingCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RatingCardComponent],
      providers: [
        provideMockActivatedRoute(),
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } },
        DestroyService
      ]
    })
      .overrideComponent(RatingCardComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(RatingCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
