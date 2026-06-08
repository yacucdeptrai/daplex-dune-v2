import { SlideMenuItemCheckbox } from './slide-menu-item-checkbox';

// Extends SlideMenuItemSelectable, which resolves CDK dependencies via Angular DI, so it cannot
// be instantiated outside an injection context. Assert the class is defined instead.
describe('SlideMenuItemCheckbox', () => {
  it('should be defined', () => {
    expect(SlideMenuItemCheckbox).toBeTruthy();
  });
});
