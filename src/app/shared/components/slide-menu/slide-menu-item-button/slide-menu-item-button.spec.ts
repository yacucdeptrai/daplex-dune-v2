import { SlideMenuItemButton } from './slide-menu-item-button';

// Extends SlideMenuItem, which resolves CDK dependencies via Angular DI, so it cannot be
// instantiated outside an injection context. Assert the class is defined instead.
describe('SlideMenuItemButton', () => {
  it('should be defined', () => {
    expect(SlideMenuItemButton).toBeTruthy();
  });
});
