import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { UsersService } from '../../../../core/services';
import { UpdateEmailComponent } from './update-email.component';
import { mockDynamicDialogConfig, mockDynamicDialogRef } from '../../../../../testing/test-helpers';

describe('UpdateEmailComponent', () => {
  let component: UpdateEmailComponent;
  let fixture: ComponentFixture<UpdateEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [UpdateEmailComponent],
    providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({ _id: 'u1', email: 'a@b.co' }) },
        { provide: UsersService, useValue: {} }
    ]
})
      .overrideComponent(UpdateEmailComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(UpdateEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.updateEmailForm).toBeTruthy();
  });
});
