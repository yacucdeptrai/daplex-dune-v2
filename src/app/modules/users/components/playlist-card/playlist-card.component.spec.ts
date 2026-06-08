import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService, DestroyService } from '../../../../core/services';
import { PlaylistCardComponent } from './playlist-card.component';
import { provideMockActivatedRoute } from '../../../../../testing/test-helpers';

describe('PlaylistCardComponent', () => {
  let component: PlaylistCardComponent;
  let fixture: ComponentFixture<PlaylistCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [PlaylistCardComponent],
    providers: [
        provideMockActivatedRoute(),
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } },
        DestroyService
    ]
})
      .overrideComponent(PlaylistCardComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(PlaylistCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
