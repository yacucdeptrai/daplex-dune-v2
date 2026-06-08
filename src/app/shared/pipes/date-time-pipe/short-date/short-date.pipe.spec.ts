import { ShortDatePipe } from './short-date.pipe';
import { TranslocoService } from '@jsverse/transloco';

describe('ShortDatePipe', () => {
  it('create an instance', () => {
    const pipe = new ShortDatePipe({} as TranslocoService);
    expect(pipe).toBeTruthy();
  });
});
