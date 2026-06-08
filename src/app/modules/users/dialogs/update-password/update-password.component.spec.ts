import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { UsersService } from '../../../../core/services';
import { UpdatePasswordComponent } from './update-password.component';
import { mockDynamicDialogConfig, mockDynamicDialogRef } from '../../../../../testing/test-helpers';

describe('UpdatePasswordComponent', () => {
  let component: UpdatePasswordComponent;
  let fixture: ComponentFixture<UpdatePasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [UpdatePasswordComponent],
    providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({ _id: 'u1' }) },
        { provide: UsersService, useValue: {} }
    ]
})
      .overrideComponent(UpdatePasswordComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(UpdatePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.updatePasswordForm).toBeTruthy();
  });
});
