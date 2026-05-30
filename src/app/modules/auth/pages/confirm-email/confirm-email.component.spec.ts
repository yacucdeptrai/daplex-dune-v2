import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmEmailComponent } from './confirm-email.component';
import { AuthService } from '../../../../core/services';
import { provideMockActivatedRoute } from '../../../../../testing/test-helpers';

describe('ConfirmEmailComponent', () => {
  let component: ConfirmEmailComponent;
  let fixture: ComponentFixture<ConfirmEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmEmailComponent],
      providers: [
        provideMockActivatedRoute({ queryParams: {} }),
        { provide: AuthService, useValue: {} }
      ]
    })
      .overrideComponent(ConfirmEmailComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(ConfirmEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
