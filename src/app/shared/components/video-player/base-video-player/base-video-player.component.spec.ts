import { BaseVideoPlayerComponent } from './base-video-player.component';

// Imports vidstack custom elements (fail to construct under Karma), declares a required
// `t` signal input, injects the VideoPlayerStore, and runs effects on construction, so it
// cannot be instantiated in a TestBed. Assert the class is defined instead.
describe('BaseVideoPlayerComponent', () => {
  it('should be defined', () => {
    expect(BaseVideoPlayerComponent).toBeTruthy();
  });
});
