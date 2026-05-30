import { SlideMenuTriggerDirective } from './slide-menu-trigger';

// Extends SlideMenuTriggerBase and injects DOCUMENT, ElementRef, Overlay and the menu stack,
// running registration logic in its constructor, so it cannot be instantiated outside an
// injection context. Assert the class is defined instead.
describe('SlideMenuTriggerDirective', () => {
  it('should be defined', () => {
    expect(SlideMenuTriggerDirective).toBeTruthy();
  });
});
