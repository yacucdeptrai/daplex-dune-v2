import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

import { ShareMediaLinkComponent } from './share-media-link.component';
import { mockDynamicDialogConfig } from '../../../../testing/test-helpers';

describe('ShareMediaLinkComponent', () => {
  let component: ShareMediaLinkComponent;
  let fixture: ComponentFixture<ShareMediaLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ShareMediaLinkComponent],
    providers: [
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig([]) }
    ]
})
      .overrideComponent(ShareMediaLinkComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(ShareMediaLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
