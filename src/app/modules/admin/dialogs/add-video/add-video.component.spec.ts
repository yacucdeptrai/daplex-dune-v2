import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { AddVideoComponent } from './add-video.component';
import { MediaService } from '../../../../core/services';
import { mockDynamicDialogConfig, mockDynamicDialogRef } from '../../../../../testing/test-helpers';

describe('AddVideoComponent', () => {
  let component: AddVideoComponent;
  let fixture: ComponentFixture<AddVideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AddVideoComponent],
    providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({ _id: 'm1' }) },
        { provide: MediaService, useValue: {} }
    ]
})
      .overrideComponent(AddVideoComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(AddVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
