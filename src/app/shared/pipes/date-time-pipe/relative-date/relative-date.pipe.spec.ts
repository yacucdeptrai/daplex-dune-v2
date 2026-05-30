import { RelativeDatePipe } from './relative-date.pipe';
import { TranslocoService } from '@ngneat/transloco';

describe('RelativeDatePipe', () => {
  it('create an instance', () => {
    const pipe = new RelativeDatePipe({} as TranslocoService);
    expect(pipe).toBeTruthy();
  });
});
