import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { ConfigureMediaComponent } from './configure-media.component';
import { ConfirmActionService, GenresService, MediaService, ProductionsService, QueueUploadService, TagsService } from '../../../../core/services';
import { WsService } from '../../../../shared/modules/ws';
import { MediaType } from '../../../../core/enums';
import {
  mockDialogService,
  mockDynamicDialogConfig,
  mockDynamicDialogRef,
  mockTranslocoService
} from '../../../../../testing/test-helpers';

describe('ConfigureMediaComponent', () => {
  let component: ConfigureMediaComponent;
  let fixture: ComponentFixture<ConfigureMediaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfigureMediaComponent],
      providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({ _id: 'm1', type: MediaType.MOVIE }) },
        { provide: DialogService, useValue: mockDialogService() },
        ConfirmationService,
        ConfirmActionService,
        { provide: MediaService, useValue: { findOne: () => of() } },
        { provide: GenresService, useValue: {} },
        { provide: ProductionsService, useValue: {} },
        { provide: TagsService, useValue: {} },
        { provide: QueueUploadService, useValue: { isMediaInQueue: () => false } },
        { provide: WsService, useValue: { fromEvent: () => of(), joinRoom: () => undefined, leaveRoom: () => undefined } },
        { provide: TranslocoService, useValue: { ...mockTranslocoService(), selectTranslation: () => of({}) } }
      ]
    })
      .overrideComponent(ConfigureMediaComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(ConfigureMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
