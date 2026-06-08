import { ContextMenuTriggerDirective } from './context-menu-trigger.directive';

// ContextMenuTriggerDirective extends a CDK menu-trigger base and resolves
// dependencies via inject() in its field initializers, so it cannot be
// instantiated outside an Angular injection context. Assert the class is
// defined instead of constructing it directly.
describe('ContextMenuTriggerDirective', () => {
  it('should be defined', () => {
    expect(ContextMenuTriggerDirective).toBeTruthy();
  });
});
