import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { DialogService } from 'primeng/dynamicdialog';

import { FeaturedMediaComponent } from './featured-media.component';
import { AuthService } from '../../../../core/services';
import {
  mockRouter,
  mockDialogService,
  mockTranslocoService
} from '../../../../../testing/test-helpers';

describe('FeaturedMediaComponent', () => {
  let component: FeaturedMediaComponent;
  let fixture: ComponentFixture<FeaturedMediaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [FeaturedMediaComponent],
    providers: [
        { provide: Router, useValue: mockRouter() },
        { provide: DialogService, useValue: mockDialogService() },
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: AuthService, useValue: {} }
    ]
})
      .overrideComponent(FeaturedMediaComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(FeaturedMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
