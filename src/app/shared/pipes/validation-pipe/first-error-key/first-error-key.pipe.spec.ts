import { FirstErrorKeyPipe } from './first-error-key.pipe';
import { TranslocoService } from '@ngneat/transloco';

describe('FirstErrorKeyPipe', () => {
  it('create an instance', () => {
    const pipe = new FirstErrorKeyPipe({} as TranslocoService);
    expect(pipe).toBeTruthy();
  });
});
