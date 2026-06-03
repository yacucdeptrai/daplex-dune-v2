import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { TranslocoService } from '@ngneat/transloco';
import { DialogService } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { DetailsComponent } from './details.component';
import { AuthService, MediaService } from '../../../../core/services';
import {
  provideMockActivatedRoute,
  mockRouter,
  mockDialogService,
  mockTranslocoService
} from '../../../../../testing/test-helpers';

describe('DetailsComponent', () => {
  let component: DetailsComponent;
  let fixture: ComponentFixture<DetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [DetailsComponent],
    providers: [
        provideMockActivatedRoute({ params: {}, queryParams: {} }),
        { provide: Router, useValue: mockRouter() },
        { provide: BreakpointObserver, useValue: { observe: () => of({ matches: false, breakpoints: {} }) } },
        { provide: Location, useValue: { replaceState: () => undefined } },
        { provide: DialogService, useValue: mockDialogService() },
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: AuthService, useValue: {} },
        { provide: MediaService, useValue: {} }
    ]
})
      .overrideComponent(DetailsComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(DetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
