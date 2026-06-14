import { ApplicationConfig, ErrorHandler, importProvidersFrom, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter, RouteReuseStrategy, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideServiceWorker } from '@angular/service-worker';
import { OverlayContainer, FullscreenOverlayContainer } from '@angular/cdk/overlay';
import { withHttpCacheInterceptor, provideHttpCache } from '@ngneat/cashew';
import { cloneDeep } from 'lodash-es';

import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { HTTP_CACHE_TTL } from '../environments/config';
import { AppInitializer } from './core/initializers/app.initializer';
import { AuthService } from './core/services';
import { GlobalErrorHandler } from './core/handlers/global-error-handler';
import { BaseUrlInterceptor } from './core/interceptors/base-url.interceptor';
import { HttpErrorInterceptor } from './core/interceptors/http-error.interceptor';
import { RECAPTCHA_SETTINGS, RecaptchaSettings, RecaptchaModule } from './shared/components/recaptcha';
import { CustomRouteReuseStrategy } from './core/strategies';
import { ROUTER_LOADER_CONFIG, RouterLoaderModule } from './shared/components/router-loader';
import { TranslocoRootModule } from './transloco-root.module';
import { HomeLayoutModule } from './shared/layouts/home-layout';
import { ToastModule } from 'primeng/toast';
import { OverlayPanelModule } from './shared/directives/overlay-panel';
import { MarkdownPipeModule } from './shared/pipes/markdown-pipe';
import { HtmlPipeModule } from './shared/pipes/html-pipe';
import { PermissionPipeModule, PermissionPipeService } from './shared/pipes/permission-pipe';
import { MediaFilterModule } from './shared/components/media-filter';
import { MaterialIndigoPreset } from '../theme/material-indigo-preset';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection(),
        provideRouter(routes, withComponentInputBinding()),
        provideAnimationsAsync(),
        provideServiceWorker('ngsw-worker.js', {
            enabled: environment.production,
            registrationStrategy: 'registerWhenStable:30000'
        }),
        importProvidersFrom(
            TranslocoRootModule,
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
        MessageService,
        DialogService,
        PermissionPipeService,
        provideAppInitializer(() => AppInitializer(inject(AuthService))()),
        {
            provide: ErrorHandler,
            useClass: GlobalErrorHandler
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: BaseUrlInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: HttpErrorInterceptor,
            multi: true
        },
        {
            provide: RECAPTCHA_SETTINGS,
            useValue: { siteKey: environment.recaptchaSiteKey } as RecaptchaSettings
        },
        {
            provide: OverlayContainer,
            useClass: FullscreenOverlayContainer
        },
        {
            provide: RouteReuseStrategy,
            useClass: CustomRouteReuseStrategy
        },
        {
            provide: ROUTER_LOADER_CONFIG,
            useValue: { latencyThreshold: 100 }
        },
        provideHttpClient(withInterceptorsFromDi(), withInterceptors([withHttpCacheInterceptor()])),
        provideHttpCache({
            ttl: HTTP_CACHE_TTL,
            responseSerializer(body: any) {
                return cloneDeep(body);
            }
        }),
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
        })
    ]
};
