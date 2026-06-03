import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { UpdateProductionComponent } from './update-production.component';
import { ProductionsService } from '../../../../core/services';
import { mockDynamicDialogConfig, mockDynamicDialogRef, mockTranslocoService } from '../../../../../testing/test-helpers';

describe('UpdateProductionComponent', () => {
  let component: UpdateProductionComponent;
  let fixture: ComponentFixture<UpdateProductionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [UpdateProductionComponent],
    providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({ _id: 'p1', name: 'Studio', country: 'US' }) },
        { provide: ProductionsService, useValue: {} },
        { provide: TranslocoService, useValue: mockTranslocoService() }
    ]
})
      .overrideComponent(UpdateProductionComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(UpdateProductionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
