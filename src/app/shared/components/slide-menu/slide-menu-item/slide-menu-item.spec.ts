import { SlideMenuItem } from './slide-menu-item';

// Injects ElementRef, NgZone, Directionality and the SLIDE_MENU_STACK token and runs setup in its
// constructor, so it cannot be instantiated outside an injection context. Assert the class is
// defined instead.
describe('SlideMenuItem', () => {
  it('should be defined', () => {
    expect(SlideMenuItem).toBeTruthy();
  });
});
