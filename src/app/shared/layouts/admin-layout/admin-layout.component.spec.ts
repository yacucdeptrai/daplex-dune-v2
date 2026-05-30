import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { EMPTY, of } from 'rxjs';

import { AdminLayoutComponent } from './admin-layout.component';
import { QueueUploadService } from '../../../core/services';
import { mockTranslocoService } from '../../../../testing/test-helpers';

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminLayoutComponent],
      providers: [
        { provide: TranslocoService, useValue: { ...mockTranslocoService(), selectTranslation: () => of({}) } },
        {
          provide: QueueUploadService,
          useValue: { displayQueue: of(false), timeRemaining: of(0), uploadQueue: EMPTY }
        }
      ]
    })
      .overrideComponent(AdminLayoutComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
