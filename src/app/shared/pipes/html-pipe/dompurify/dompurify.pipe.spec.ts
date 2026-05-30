import { DompurifyPipe } from './dompurify.pipe';
import { DompurifyService } from './dompurify.service';

describe('DompurifyPipe', () => {
  it('create an instance', () => {
    const pipe = new DompurifyPipe({} as DompurifyService);
    expect(pipe).toBeTruthy();
  });
});
