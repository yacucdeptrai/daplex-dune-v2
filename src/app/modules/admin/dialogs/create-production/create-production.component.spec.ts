import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

import { CreateProductionComponent } from './create-production.component';
import { ProductionsService } from '../../../../core/services';
import { mockDynamicDialogRef, mockTranslocoService } from '../../../../../testing/test-helpers';

describe('CreateProductionComponent', () => {
  let component: CreateProductionComponent;
  let fixture: ComponentFixture<CreateProductionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateProductionComponent],
      providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: ProductionsService, useValue: {} },
        { provide: TranslocoService, useValue: mockTranslocoService() }
      ]
    })
      .overrideComponent(CreateProductionComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(CreateProductionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
