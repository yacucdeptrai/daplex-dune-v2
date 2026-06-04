import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { PlaylistSettingsComponent } from './playlist-settings.component';
import { PlaylistsService } from '../../../core/services';
import {
  mockDialogService,
  mockDynamicDialogConfig,
  mockDynamicDialogRef,
  mockTranslocoService
} from '../../../../testing/test-helpers';

describe('PlaylistSettingsComponent', () => {
  let component: PlaylistSettingsComponent;
  let fixture: ComponentFixture<PlaylistSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [PlaylistSettingsComponent],
    providers: [
        { provide: TranslocoService, useValue: { ...mockTranslocoService(), selectTranslation: () => of({}) } },
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({ _id: 'playlist-1' }) },
        { provide: DialogService, useValue: mockDialogService() },
        { provide: PlaylistsService, useValue: { findOne: () => of({ _id: 'playlist-1', name: '', description: null, visibility: 1 }) } }
    ]
})
      .overrideComponent(PlaylistSettingsComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(PlaylistSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
