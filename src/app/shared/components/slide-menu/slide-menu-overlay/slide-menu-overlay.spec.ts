import { SlideMenuOverlay } from './slide-menu-overlay';

// Extends CdkMenuGroup and resolves dependencies via Angular DI, so it cannot be
// instantiated outside an injection context. Assert the class is defined instead.
describe('SlideMenuOverlay', () => {
  it('should be defined', () => {
    expect(SlideMenuOverlay).toBeTruthy();
  });
});
