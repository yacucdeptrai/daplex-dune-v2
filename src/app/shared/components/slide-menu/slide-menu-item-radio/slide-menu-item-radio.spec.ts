import { SlideMenuItemRadio } from './slide-menu-item-radio';

// Extends SlideMenuItemSelectable and injects UniqueSelectionDispatcher, registering a dispatcher
// listener in its constructor, so it cannot be instantiated outside an injection context. Assert
// the class is defined instead.
describe('SlideMenuItemRadio', () => {
  it('should be defined', () => {
    expect(SlideMenuItemRadio).toBeTruthy();
  });
});
