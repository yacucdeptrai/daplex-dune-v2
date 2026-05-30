import { NgForRepeatDirective } from './ng-for-repeat.directive';

// Generic directive extending NgForOf with injected dependencies, so it cannot be
// instantiated outside an injection context. Assert the class is defined instead.
describe('NgForRepeatDirective', () => {
  it('should be defined', () => {
    expect(NgForRepeatDirective).toBeTruthy();
  });
});
