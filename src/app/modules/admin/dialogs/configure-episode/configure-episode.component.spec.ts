import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { ConfigureEpisodeComponent } from './configure-episode.component';
import { ConfirmActionService, MediaService, QueueUploadService } from '../../../../core/services';
import {
  mockDialogService,
  mockDynamicDialogConfig,
  mockDynamicDialogRef,
  mockTranslocoService
} from '../../../../../testing/test-helpers';

describe('ConfigureEpisodeComponent', () => {
  let component: ConfigureEpisodeComponent;
  let fixture: ComponentFixture<ConfigureEpisodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ConfigureEpisodeComponent],
    providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        {
            provide: DynamicDialogConfig,
            useValue: mockDynamicDialogConfig({
                media: { _id: 'm1' },
                episode: { _id: 'e1', epNumber: 1 }
            })
        },
        { provide: DialogService, useValue: mockDialogService() },
        ConfirmationService,
        ConfirmActionService,
        { provide: MediaService, useValue: { findOneTVEpisode: () => of() } },
        { provide: QueueUploadService, useValue: {} },
        { provide: TranslocoService, useValue: mockTranslocoService() }
    ]
})
      .overrideComponent(ConfigureEpisodeComponent, { set: { template: '', imports: [] } })
      .compileComponents();
    fixture = TestBed.createComponent(ConfigureEpisodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
