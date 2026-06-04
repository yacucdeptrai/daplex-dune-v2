import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { CreateEpisodeComponent } from './create-episode.component';
import { MediaService, QueueUploadService } from '../../../../core/services';
import {
  mockDialogService,
  mockDynamicDialogConfig,
  mockDynamicDialogRef,
  mockTranslocoService
} from '../../../../../testing/test-helpers';

describe('CreateEpisodeComponent', () => {
  let component: CreateEpisodeComponent;
  let fixture: ComponentFixture<CreateEpisodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [CreateEpisodeComponent],
    providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        {
            provide: DynamicDialogConfig,
            useValue: mockDynamicDialogConfig({
                media: { _id: 'm1', runtime: 0, releaseDate: { day: 1, month: 1, year: 2020 } },
                episodes: []
            })
        },
        { provide: DialogService, useValue: mockDialogService() },
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: MediaService, useValue: {} },
        { provide: QueueUploadService, useValue: {} }
    ]
})
      .overrideComponent(CreateEpisodeComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(CreateEpisodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
