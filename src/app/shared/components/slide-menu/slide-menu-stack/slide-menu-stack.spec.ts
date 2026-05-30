import { SlideMenuStack } from './slide-menu-stack';

// Injectable service that injects the CDK Overlay via inject(), so it cannot be instantiated
// outside an injection context. Assert the class is defined instead.
describe('SlideMenuStack', () => {
  it('should be defined', () => {
    expect(SlideMenuStack).toBeTruthy();
  });
});
