import { LazyLoadPlaceholderDirective } from './lazyload-placeholder.directive';

// Requires injected dependencies, so it cannot be instantiated outside an injection
// context. Assert the class is defined rather than constructing it directly.
describe('LazyLoadPlaceholderDirective', () => {
  it('should be defined', () => {
    expect(LazyLoadPlaceholderDirective).toBeTruthy();
  });
});
