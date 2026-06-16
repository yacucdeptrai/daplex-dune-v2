/**
 * Test-bed mirror of the real application config (`src/app/app.config.ts`).
 *
 * The shared `test-helpers.ts` `mockDialogService` stubs `DialogService.open()`,
 * which silently hides the very DI-scope failures (NG0201) and signal-input
 * failures (NG0950) the gate exists to catch. This harness provides the FULL
 * runtime provider set so a smoke spec mounts a dialog/route under the same
 * injector graph the browser uses — no stubbed seams.
 *
 * Mirrors the 17-entry provider set from `01_gate_analyst_brief.md §4`, with the
 * documented test swaps:
 *   - `ErrorHandler` → `FailingErrorHandler` (A1) instead of `GlobalErrorHandler`
 *     (so a framework error fails the spec instead of being swallowed).
 *   - `provideHttpClient()` + `provideHttpClientTesting()` instead of the live
 *     interceptor-from-DI client (keeps `withInterceptorsFromDi()` so the DI
 *     interceptors still resolve), plus `provideHttpCache({ttl: 0})`.
 *   - `provideServiceWorker` omitted (disabled under `environment.production=false`).
 *
 * It ALSO provides the route-scoped tokens that dialogs/confirm flows need at
 * runtime — `ConfirmationService`, `ConfirmActionService`, and a root
 * `TRANSLOCO_SCOPE` — so a dialog opened directly in the bed (outside a route
 * injector) resolves them. The route-walk smoke (`routes.smoke.spec.ts`) uses
 * the REAL route `providers` instead, keeping the NG0201 detection zone honest.
 */

import {
  EnvironmentProviders,
  ErrorHandler,
  importProvidersFrom,
  Provider,
  provideZoneChangeDetection
} from '@angular/core';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  provideRouter,
  RouteReuseStrategy,
  Routes,
  withComponentInputBinding
} from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { OverlayContainer, FullscreenOverlayContainer } from '@angular/cdk/overlay';
import { withHttpCacheInterceptor, provideHttpCache } from '@ngneat/cashew';

import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { providePrimeNG } from 'primeng/config';
import { ToastModule } from 'primeng/toast';
import { TRANSLOCO_SCOPE } from '@jsverse/transloco';

import { BaseUrlInterceptor } from '../app/core/interceptors/base-url.interceptor';
import { HttpErrorInterceptor } from '../app/core/interceptors/http-error.interceptor';
import { CustomRouteReuseStrategy } from '../app/core/strategies';
import { ConfirmActionService } from '../app/core/services/confirm-action.service';
import { PlaylistsService, UsersService, QueueUploadService } from '../app/core/services';
import { WsService } from '../app/shared/modules/ws';
import {
  ROUTER_LOADER_CONFIG,
  RouterLoaderModule
} from '../app/shared/components/router-loader';
import {
  RECAPTCHA_SETTINGS,
  RecaptchaSettings,
  RecaptchaModule
} from '../app/shared/components/recaptcha';
import { PermissionPipeModule } from '../app/shared/pipes/permission-pipe';
import { OverlayPanelModule } from '../app/shared/directives/overlay-panel';
import { MarkdownPipeModule } from '../app/shared/pipes/markdown-pipe';
import { HtmlPipeModule } from '../app/shared/pipes/html-pipe';
import { MediaFilterModule } from '../app/shared/components/media-filter';
import { HomeLayoutModule } from '../app/shared/layouts/home-layout';
import { MaterialIndigoPreset } from '../theme/material-indigo-preset';
import { FailingErrorHandler } from './console-error-guard';
import { provideTranslocoTesting } from './test-helpers';

/**
 * Mirror of `appConfig.providers` for the test bed.
 *
 * @param routes Optional real route config for route-walk smoke specs. When
 *   provided, the router is configured with these routes (and their per-node
 *   `providers`, which is where the genuine NG0201 trap lives); otherwise an
 *   empty route set is used (dialog/overlay smoke specs that don't navigate).
 */
export function provideAppConfigForTest(
  routes: Routes = []
): (Provider | EnvironmentProviders)[] {
  return [
    // 1. Zone change detection — keep parity with prod bootstrap.
    provideZoneChangeDetection(),

    // 2. Router with component input binding (route-input collisions surface here).
    provideRouter(routes, withComponentInputBinding()),

    // 3. Async animations — required for PrimeNG v21 `pMotion`.
    provideAnimationsAsync(),

    // 4. provideServiceWorker — omitted (disabled when environment.production=false).

    // 5. PrimeNG root services. (PermissionPipeService comes from PermissionPipeModule
    //    in the importProvidersFrom mirror below, matching prod — not provided bare here.)
    MessageService,
    DialogService,

    // 6. App initializer — omitted in test (would trigger AuthService bootstrap HTTP).

    // 7. ErrorHandler — SWAP GlobalErrorHandler → FailingErrorHandler so NG-coded
    //    errors routed through the framework fail the spec instead of being logged.
    { provide: ErrorHandler, useClass: FailingErrorHandler },

    // 8/9. DI-resolved HTTP interceptors (kept so withInterceptorsFromDi() resolves them).
    { provide: HTTP_INTERCEPTORS, useClass: BaseUrlInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },

    // 10. reCAPTCHA settings (sign-in/up routes read it).
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: { siteKey: 'test-recaptcha-site-key' } as RecaptchaSettings
    },

    // 11. CDK overlay container swap (PrimeNG dialogs + CDK menus share this stack).
    { provide: OverlayContainer, useClass: FullscreenOverlayContainer },

    // 12. Custom route-reuse strategy (drives the 7 reuse routes A→B→A).
    { provide: RouteReuseStrategy, useClass: CustomRouteReuseStrategy },

    // 13. Router-loader latency config.
    { provide: ROUTER_LOADER_CONFIG, useValue: { latencyThreshold: 100 } },

    // 14. HTTP client — SWAP to testing backend; keep withInterceptorsFromDi() +
    //     the cache interceptor so the DI graph matches prod.
    provideHttpClient(
      withInterceptorsFromDi(),
      withInterceptors([withHttpCacheInterceptor()])
    ),
    provideHttpClientTesting(),

    // 15. HTTP cache — ttl:0 so nothing is cached across specs.
    provideHttpCache({ ttl: 0 }),

    // 16. PrimeNG theme — REAL MaterialIndigoPreset (missing preset = silent-unstyled,
    //     not a throw; A7 asserts the injected theme CSS-vars).
    providePrimeNG({
      ripple: true,
      theme: {
        preset: MaterialIndigoPreset,
        options: {
          prefix: 'p',
          darkModeSelector: '.p-dark',
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities'
          }
        }
      }
    }),

    // 17. Module providers — FAITHFUL mirror of app.config.ts:44-55's full
    //     importProvidersFrom set, so the test root injector === the prod root
    //     injector. Hand-picking a subset produced FALSE NG0201 reds (a standalone
    //     consumer injecting a token a real root module provides — MediaFilterService,
    //     MarkedService, APP_CONNECTED_OVERLAY_SCROLL_STRATEGY, etc.). Mirroring the
    //     whole set also prevents the next false-red from a future omitted module.
    //
    //     prod order: TranslocoRootModule, RouterLoaderModule, HomeLayoutModule,
    //     ToastModule, OverlayPanelModule, MarkdownPipeModule, HtmlPipeModule,
    //     PermissionPipeModule, MediaFilterModule, RecaptchaModule.
    //
    //     ONE documented swap (guardrail #1 — test-hostile module): TranslocoRootModule
    //     is replaced by provideTranslocoTesting() — the real module pulls a live HTTP
    //     transloco loader + app-init side effects. Its providers (TranslocoService /
    //     transpiler / scope) are supplied by the testing module instead, so the root
    //     injector still resolves every transloco token. All other 9 modules are mirrored
    //     verbatim and are test-safe (no live HTTP/APP_INITIALIZER; verified deps are
    //     root-only — DompurifyService→DomSanitizer, HomeHeader→DialogService[already root]).
    importProvidersFrom(
      RouterLoaderModule,
      HomeLayoutModule,
      ToastModule,
      OverlayPanelModule,
      MarkdownPipeModule,
      HtmlPipeModule,
      PermissionPipeModule,
      MediaFilterModule,
      RecaptchaModule
    ),
    ...provideTranslocoTesting(),

    // Route-scoped tokens dialogs/confirm flows need when opened directly in the
    // bed (NOT via a route injector). The route-walk smoke uses real route
    // providers, so providing these at root does NOT mask the NG0201 trap there.
    // ConfirmActionService is the genuine NG0201 trap (depends on ConfirmationService);
    // UsersService/PlaylistsService are route-scoped (usersProviders/mediaProviders)
    // and required by the users/playlist dialogs so opening them in the bed mounts
    // without a *false* NG0201. They are plain @Injectable services — instantiating
    // them issues no HTTP during a mount-only smoke (the testing backend stays idle).
    ConfirmationService,
    ConfirmActionService,
    UsersService,
    PlaylistsService,
    // WsService (shared ws module) + QueueUploadService are route/component-scoped
    // (admin route node + configure-media/create-media component providers). The
    // admin/users dialogs inject them, so providing at root lets those dialogs mount
    // in the bed without a *false* NG0201. Their constructors take only root deps
    // (AuthService / HttpClient) so instantiation is side-effect-free here.
    WsService,
    QueueUploadService,
    { provide: TRANSLOCO_SCOPE, useValue: ['home', 'media', 'auth', 'admin', 'users'] }
  ];
}
