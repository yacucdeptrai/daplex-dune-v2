import { IsGrantedPipe } from './is-granted.pipe';
import { PermissionPipeService } from '../permission-pipe.service';

describe('IsGrantedPipe', () => {
  it('create an instance', () => {
    const pipe = new IsGrantedPipe({} as PermissionPipeService);
    expect(pipe).toBeTruthy();
  });
});
