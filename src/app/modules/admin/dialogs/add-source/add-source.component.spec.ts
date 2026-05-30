import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { AddSourceComponent } from './add-source.component';
import { QueueUploadService } from '../../../../core/services';
import { mockDynamicDialogConfig, mockDynamicDialogRef } from '../../../../../testing/test-helpers';

describe('AddSourceComponent', () => {
  let component: AddSourceComponent;
  let fixture: ComponentFixture<AddSourceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddSourceComponent],
      providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({}) },
        { provide: QueueUploadService, useValue: {} }
      ]
    })
      .overrideComponent(AddSourceComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(AddSourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
