import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

import { CreatePlaylistComponent } from './create-playlist.component';
import { HTTP_TEST_PROVIDERS, mockDynamicDialogRef } from '../../../../../testing/test-helpers';

describe('CreatePlaylistComponent', () => {
  let component: CreatePlaylistComponent;
  let fixture: ComponentFixture<CreatePlaylistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [CreatePlaylistComponent],
    providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        ...HTTP_TEST_PROVIDERS
    ]
})
      .overrideComponent(CreatePlaylistComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(CreatePlaylistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.createPlaylistForm).toBeTruthy();
  });
});
