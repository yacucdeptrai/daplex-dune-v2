import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectOrderComponent } from './select-order.component';

describe('SelectOrderComponent', () => {
  let component: SelectOrderComponent;
  let fixture: ComponentFixture<SelectOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectOrderComponent]
    })
      .overrideComponent(SelectOrderComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SelectOrderComponent);
    component = fixture.componentInstance;
    // `t` is a required signal input; supply it before change detection.
    fixture.componentRef.setInput('t', (key: string) => key);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
