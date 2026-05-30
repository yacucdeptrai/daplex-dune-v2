import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { AddSubtitleComponent } from './add-subtitle.component';
import { MediaService } from '../../../../core/services';
import { MediaType } from '../../../../core/enums';
import { mockDynamicDialogConfig, mockDynamicDialogRef, mockTranslocoService } from '../../../../../testing/test-helpers';

describe('AddSubtitleComponent', () => {
  let component: AddSubtitleComponent;
  let fixture: ComponentFixture<AddSubtitleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddSubtitleComponent],
      providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        {
          provide: DynamicDialogConfig,
          useValue: mockDynamicDialogConfig({
            media: { _id: 'm1', type: MediaType.MOVIE, movie: { subtitles: [] } },
            episode: { _id: 'e1', subtitles: [] },
            file: null
          })
        },
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: MediaService, useValue: {} }
      ]
    })
      .overrideComponent(AddSubtitleComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(AddSubtitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
