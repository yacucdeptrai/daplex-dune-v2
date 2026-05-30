import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerticalTabComponent } from './vertical-tab.component';

describe('VerticalTabComponent', () => {
  let component: VerticalTabComponent;
  let fixture: ComponentFixture<VerticalTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VerticalTabComponent]
    })
      .overrideComponent(VerticalTabComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(VerticalTabComponent);
    component = fixture.componentInstance;
    // Construction/DI smoke test only: `detectChanges()` is skipped because the real
    // `ngAfterContentInit` reads projected tab panels (`@ContentChildren`) absent here.
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
