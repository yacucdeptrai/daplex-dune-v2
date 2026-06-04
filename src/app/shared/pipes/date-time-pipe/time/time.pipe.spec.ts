import { TimePipe } from './time.pipe';
import { TranslocoService } from '@jsverse/transloco';

describe('TimePipe', () => {
  it('create an instance', () => {
    const pipe = new TimePipe({} as TranslocoService);
    expect(pipe).toBeTruthy();
  });
});
