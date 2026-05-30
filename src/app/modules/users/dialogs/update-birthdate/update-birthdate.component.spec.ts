import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { UsersService } from '../../../../core/services';
import { UpdateBirthdateComponent } from './update-birthdate.component';
import { mockDynamicDialogConfig, mockDynamicDialogRef, mockTranslocoService } from '../../../../../testing/test-helpers';

describe('UpdateBirthdateComponent', () => {
  let component: UpdateBirthdateComponent;
  let fixture: ComponentFixture<UpdateBirthdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UpdateBirthdateComponent],
      providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({ _id: 'u1', birthdate: { day: 1, month: 1, year: 2000 } }) },
        { provide: UsersService, useValue: {} },
        { provide: TranslocoService, useValue: mockTranslocoService() }
      ]
    })
      .overrideComponent(UpdateBirthdateComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(UpdateBirthdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.updateBirthdateForm).toBeTruthy();
  });
});
