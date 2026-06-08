import { TestBed } from '@angular/core/testing';

import { PermissionPipeService } from './permission-pipe.service';
import { User, UserDetails } from '../../../core/models';

describe('PermissionPipeService', () => {
  let service: PermissionPipeService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PermissionPipeService] });
    service = TestBed.inject(PermissionPipeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('hasPermission', () => {
    it('returns true for an owner without inspecting roles', () => {
      expect(service.hasPermission({ owner: true } as User, [4])).toBe(true);
    });

    it('returns false when the user has no roles', () => {
      expect(service.hasPermission({ owner: false } as User, [4])).toBe(false);
    });

    it('returns true when a role bitmask matches a requested permission', () => {
      const user = { owner: false, roles: [{ permissions: 0b0110 }] } as unknown as User;
      expect(service.hasPermission(user, [0b0100])).toBe(true);
    });

    it('returns false when no role bitmask matches', () => {
      const user = { owner: false, roles: [{ permissions: 0b0010 }] } as unknown as User;
      expect(service.hasPermission(user, [0b0100])).toBe(false);
    });
  });

  describe('isGranted', () => {
    it('returns true for an owner', () => {
      expect(service.isGranted({ owner: true } as UserDetails, 4)).toBe(true);
    });

    it('returns true when the permission is in the granted list', () => {
      expect(service.isGranted({ owner: false, granted: [4, 8] } as UserDetails, 8)).toBe(true);
    });

    it('returns false when the permission is not granted', () => {
      expect(service.isGranted({ owner: false, granted: [4] } as UserDetails, 8)).toBe(false);
    });
  });
});
