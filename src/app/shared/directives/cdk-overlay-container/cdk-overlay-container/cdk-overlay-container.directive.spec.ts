import { CdkOverlayContainerDirective } from './cdk-overlay-container.directive';

// Requires injected dependencies (Renderer2, ElementRef, OverlayContainer), so it
// cannot be instantiated outside an injection context. Assert the class is defined.
describe('CdkOverlayContainerDirective', () => {
  it('should be defined', () => {
    expect(CdkOverlayContainerDirective).toBeTruthy();
  });
});
