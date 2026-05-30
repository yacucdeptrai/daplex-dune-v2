import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { AddAllToPlaylistComponent } from './add-all-to-playlist.component';
import { PlaylistsService } from '../../../core/services';
import { mockDynamicDialogConfig, mockDynamicDialogRef } from '../../../../testing/test-helpers';

describe('AddAllToPlaylistComponent', () => {
  let component: AddAllToPlaylistComponent;
  let fixture: ComponentFixture<AddAllToPlaylistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddAllToPlaylistComponent],
      providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({ _id: 'playlist-1' }) },
        { provide: PlaylistsService, useValue: { findAddToPlaylist: () => of([]) } }
      ]
    })
      .overrideComponent(AddAllToPlaylistComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(AddAllToPlaylistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
