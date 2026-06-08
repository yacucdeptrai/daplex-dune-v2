import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { AddToPlaylistComponent } from './add-to-playlist.component';
import { PlaylistsService } from '../../../core/services';
import { mockDynamicDialogConfig } from '../../../../testing/test-helpers';

describe('AddToPlaylistComponent', () => {
  let component: AddToPlaylistComponent;
  let fixture: ComponentFixture<AddToPlaylistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AddToPlaylistComponent],
    providers: [
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({ _id: 'media-1' }) }
    ]
})
      // PlaylistsService is a component-level provider; replace it and blank the template in the
      // SAME `set` (mixing `set` with `add`/`remove` is not allowed).
      .overrideComponent(AddToPlaylistComponent, {
        set: {
          template: '',
          providers: [{ provide: PlaylistsService, useValue: { findAddToPlaylist: () => of([]) } }]
        }
      })
      .compileComponents();
    fixture = TestBed.createComponent(AddToPlaylistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
