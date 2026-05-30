import { NgControl } from '@angular/forms';

import { DisabledControlDirective } from './disabled-control.directive';

describe('DisabledControlDirective', () => {
  it('should create an instance', () => {
    const directive = new DisabledControlDirective({} as NgControl);
    expect(directive).toBeTruthy();
  });
});
