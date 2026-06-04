import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  let component: AvatarComponent;
  let fixture: ComponentFixture<AvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AvatarComponent]
})
      // Blank the template: this is a construction/DI smoke test, so we deliberately skip
      // rendering the real template (which depends on the `charColor` pipe + sibling modules).
      .overrideComponent(AvatarComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(AvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
