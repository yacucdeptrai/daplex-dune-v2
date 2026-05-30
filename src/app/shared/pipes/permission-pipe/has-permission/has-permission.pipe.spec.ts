import { HasPermissionPipe } from './has-permission.pipe';
import { PermissionPipeService } from '../permission-pipe.service';

describe('HasPermissionPipe', () => {
  it('create an instance', () => {
    const pipe = new HasPermissionPipe({} as PermissionPipeService);
    expect(pipe).toBeTruthy();
  });
});
