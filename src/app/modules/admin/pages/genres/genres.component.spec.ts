import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

import { GenresComponent } from './genres.component';
import { ConfirmActionService, GenresService } from '../../../../core/services';
import { mockDialogService, mockTranslocoService } from '../../../../../testing/test-helpers';

describe('GenresComponent', () => {
  let component: GenresComponent;
  let fixture: ComponentFixture<GenresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [GenresComponent],
    providers: [
        { provide: DialogService, useValue: mockDialogService() },
        ConfirmationService,
        ConfirmActionService,
        { provide: GenresService, useValue: {} },
        { provide: TranslocoService, useValue: mockTranslocoService() }
    ]
})
      .overrideComponent(GenresComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(GenresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
