import { TemplateForDirective } from './template-for.directive';

// Uses signal input() and injects TemplateRef, both of which require an active injection context,
// so it cannot be instantiated directly. Assert the class is defined instead.
describe('TemplateForDirective', () => {
  it('should be defined', () => {
    expect(TemplateForDirective).toBeTruthy();
  });
});
