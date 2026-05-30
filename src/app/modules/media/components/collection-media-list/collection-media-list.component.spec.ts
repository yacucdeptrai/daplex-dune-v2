import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { DialogService } from 'primeng/dynamicdialog';

import { CollectionMediaListComponent } from './collection-media-list.component';
import { AuthService } from '../../../../core/services';
import {
  mockRouter,
  mockDialogService,
  mockTranslocoService
} from '../../../../../testing/test-helpers';

describe('CollectionMediaListComponent', () => {
  let component: CollectionMediaListComponent;
  let fixture: ComponentFixture<CollectionMediaListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CollectionMediaListComponent],
      providers: [
        { provide: Router, useValue: mockRouter() },
        { provide: DialogService, useValue: mockDialogService() },
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: AuthService, useValue: {} }
      ]
    })
      .overrideComponent(CollectionMediaListComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(CollectionMediaListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('t', (key: string) => key);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
