import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { UpdateUsernameComponent } from './update-username.component';
import { UsersService } from '../../../../core/services';
import {
  mockDynamicDialogConfig,
  mockDynamicDialogRef
} from '../../../../../testing/test-helpers';

describe('UpdateUsernameComponent', () => {
  let component: UpdateUsernameComponent;
  let fixture: ComponentFixture<UpdateUsernameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, UpdateUsernameComponent],
    providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        // The constructor eagerly reads config.data.username / _id, so supply them.
        {
            provide: DynamicDialogConfig,
            useValue: mockDynamicDialogConfig({ _id: 'u1', username: 'alice' })
        },
        { provide: UsersService, useValue: {} }
    ]
})
      .overrideComponent(UpdateUsernameComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(UpdateUsernameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('initialises the form with the username from the dialog config', () => {
    expect(component.updateUsernameForm.controls.username.value).toBe('alice');
  });
});
