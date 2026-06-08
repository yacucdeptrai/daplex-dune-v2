import { DateAltPipe } from './date-alt.pipe';
import { TranslocoService } from '@jsverse/transloco';

describe('DateAltPipe', () => {
  it('create an instance', () => {
    const pipe = new DateAltPipe({} as TranslocoService);
    expect(pipe).toBeTruthy();
  });
});
