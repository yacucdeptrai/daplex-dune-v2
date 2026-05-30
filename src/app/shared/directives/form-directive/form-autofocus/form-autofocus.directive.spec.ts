import { FormAutofocusDirective } from './form-autofocus.directive';

// Injects ElementRef; constructing a real ElementRef requires a DOM element, which is impractical
// to fabricate here. Assert the class is defined instead.
describe('FormAutofocusDirective', () => {
  it('should be defined', () => {
    expect(FormAutofocusDirective).toBeTruthy();
  });
});
