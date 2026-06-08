import { RelativeDatePipe } from './relative-date.pipe';
import { TranslocoService } from '@jsverse/transloco';

describe('RelativeDatePipe', () => {
  it('create an instance', () => {
    const pipe = new RelativeDatePipe({} as TranslocoService);
    expect(pipe).toBeTruthy();
  });
});
