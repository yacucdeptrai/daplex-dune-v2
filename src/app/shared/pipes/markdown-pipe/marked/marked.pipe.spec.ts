import { MarkedPipe } from './marked.pipe';
import { MarkedService } from './marked.service';

describe('MarkedPipe', () => {
  it('create an instance', () => {
    const pipe = new MarkedPipe({} as MarkedService);
    expect(pipe).toBeTruthy();
  });
});
