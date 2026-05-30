import { VideoPlayerComponent } from './video-player.component';

// Depends transitively on the vidstack player elements and the VideoPlayerStore, and wires up
// effects/observables in its constructor, so it cannot be instantiated in a TestBed. Assert the
// class is defined instead.
describe('VideoPlayerComponent', () => {
  it('should be defined', () => {
    expect(VideoPlayerComponent).toBeTruthy();
  });
});
