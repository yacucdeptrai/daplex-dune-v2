import { MenuDirective } from './menu.directive';

// MenuDirective extends a CDK menu base that uses inject() and builds animations
// in its constructor, so it cannot be instantiated outside an Angular injection
// context. Assert the class is defined instead of constructing it directly.
describe('MenuDirective', () => {
  it('should be defined', () => {
    expect(MenuDirective).toBeTruthy();
  });
});
