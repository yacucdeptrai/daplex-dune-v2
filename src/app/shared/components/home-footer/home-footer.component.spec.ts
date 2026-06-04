import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeFooterComponent } from './home-footer.component';
import { provideTranslocoTesting } from '../../../../testing/test-helpers';

describe('HomeFooterComponent', () => {
  let component: HomeFooterComponent;
  let fixture: ComponentFixture<HomeFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [HomeFooterComponent],
    providers: [provideTranslocoTesting()]
})
    .overrideComponent(HomeFooterComponent, { set: { template: '' } })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
