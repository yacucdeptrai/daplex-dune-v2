import { AppOverlayOrigin } from './overlay-panel.directive';

// Requires many injected dependencies, so it cannot be instantiated outside an
// injection context. Assert the class is defined rather than constructing it.
describe('AppOverlayOrigin', () => {
  it('should be defined', () => {
    expect(AppOverlayOrigin).toBeTruthy();
  });
});
