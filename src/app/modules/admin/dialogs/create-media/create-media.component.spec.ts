import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { CreateMediaComponent } from './create-media.component';
import { GenresService, MediaService, ProductionsService, QueueUploadService, TagsService } from '../../../../core/services';
import { MediaType } from '../../../../core/enums';
import {
  mockDialogService,
  mockDynamicDialogConfig,
  mockDynamicDialogRef,
  mockTranslocoService
} from '../../../../../testing/test-helpers';

describe('CreateMediaComponent', () => {
  let component: CreateMediaComponent;
  let fixture: ComponentFixture<CreateMediaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [CreateMediaComponent],
    providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({ type: MediaType.MOVIE }) },
        { provide: DialogService, useValue: mockDialogService() },
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: MediaService, useValue: {} },
        { provide: GenresService, useValue: {} },
        { provide: ProductionsService, useValue: {} },
        { provide: TagsService, useValue: {} },
        { provide: QueueUploadService, useValue: {} }
    ]
})
      .overrideComponent(CreateMediaComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(CreateMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
