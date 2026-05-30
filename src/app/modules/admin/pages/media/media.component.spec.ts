import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { MediaComponent } from './media.component';
import { MediaService, QueueUploadService } from '../../../../core/services';
import { WsService } from '../../../../shared/modules/ws';
import {
  mockDialogService,
  mockRouter,
  mockTranslocoService,
  provideMockActivatedRoute
} from '../../../../../testing/test-helpers';

describe('MediaComponent', () => {
  let component: MediaComponent;
  let fixture: ComponentFixture<MediaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MediaComponent],
      providers: [
        provideMockActivatedRoute(),
        { provide: Router, useValue: mockRouter() },
        { provide: DialogService, useValue: mockDialogService() },
        ConfirmationService,
        { provide: MediaService, useValue: {} },
        { provide: QueueUploadService, useValue: {} },
        { provide: WsService, useValue: { fromEvent: () => of(), joinRoom: () => undefined, leaveRoom: () => undefined } },
        { provide: TranslocoService, useValue: mockTranslocoService() }
      ]
    })
      .overrideComponent(MediaComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(MediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
