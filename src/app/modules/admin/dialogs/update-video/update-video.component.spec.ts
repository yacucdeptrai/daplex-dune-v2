import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { UpdateVideoComponent } from './update-video.component';
import { MediaService } from '../../../../core/services';
import { mockDynamicDialogConfig, mockDynamicDialogRef, mockTranslocoService } from '../../../../../testing/test-helpers';

describe('UpdateVideoComponent', () => {
  let component: UpdateVideoComponent;
  let fixture: ComponentFixture<UpdateVideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [UpdateVideoComponent],
    providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        {
            provide: DynamicDialogConfig,
            useValue: mockDynamicDialogConfig({
                media: { _id: 'm1' },
                video: { _id: 'v1', key: 'abcdefghijk', name: 'Trailer' }
            })
        },
        { provide: MediaService, useValue: {} },
        { provide: TranslocoService, useValue: mockTranslocoService() }
    ]
})
      .overrideComponent(UpdateVideoComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(UpdateVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
