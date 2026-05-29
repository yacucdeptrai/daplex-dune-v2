import { AuthService } from '../services';
import { AUTH_COOKIE_MARKER } from '../constants';

export function AppInitializer(authService: AuthService) {
  return () => new Promise<boolean>(resolve => {
    const authenticated = document.cookie.indexOf(AUTH_COOKIE_MARKER) > -1;
    if (authenticated) {
      // Attempt to refresh token on app start up to auto authenticate
      authService.refreshToken().subscribe().add(() => resolve(true));
    } else {
      resolve(true);
    }
  });
}
