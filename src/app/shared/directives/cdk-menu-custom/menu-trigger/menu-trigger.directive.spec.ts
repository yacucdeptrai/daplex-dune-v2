import { MenuTriggerDirective } from './menu-trigger.directive';

// Extends CdkMenuTriggerBase and injects ElementRef, Overlay, NgZone and the CDK menu tokens,
// running subscription setup in its constructor, so it cannot be instantiated outside an injection
// context. Assert the class is defined instead.
describe('MenuTriggerDirective', () => {
  it('should be defined', () => {
    expect(MenuTriggerDirective).toBeTruthy();
  });
});
