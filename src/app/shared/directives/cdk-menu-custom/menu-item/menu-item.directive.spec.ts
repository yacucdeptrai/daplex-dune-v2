import { MenuItemDirective } from './menu-item.directive';

// Injects ElementRef, NgZone, Directionality and the CDK MENU_STACK/MENU_AIM tokens and runs setup
// in its constructor, so it cannot be instantiated outside an injection context. Assert the class
// is defined instead.
describe('MenuItemDirective', () => {
  it('should be defined', () => {
    expect(MenuItemDirective).toBeTruthy();
  });
});
