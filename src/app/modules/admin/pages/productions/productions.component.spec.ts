import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

import { ProductionsComponent } from './productions.component';
import { ConfirmActionService, ProductionsService } from '../../../../core/services';
import { mockDialogService, mockTranslocoService } from '../../../../../testing/test-helpers';

describe('ProductionsComponent', () => {
  let component: ProductionsComponent;
  let fixture: ComponentFixture<ProductionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductionsComponent],
      providers: [
        { provide: DialogService, useValue: mockDialogService() },
        ConfirmationService,
        ConfirmActionService,
        { provide: ProductionsService, useValue: {} },
        { provide: TranslocoService, useValue: mockTranslocoService() }
      ]
    })
      .overrideComponent(ProductionsComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(ProductionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
