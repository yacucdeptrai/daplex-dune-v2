import { enableProdMode, provideZoneChangeDetection, APP_INITIALIZER, ErrorHandler, importProvidersFrom } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';


import { environment } from './environments/environment';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { providePrimeNG } from 'primeng/config';
import MdDarkIndigo from '@primeuix/themes/mddarkindigo';
import { AppInitializer } from './app/core/initializers/app.initializer';
import { AuthService } from './app/core/services';
import { GlobalErrorHandler } from './app/core/handlers/global-error-handler';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi, withInterceptors } from '@angular/common/http';
import { BaseUrlInterceptor } from './app/core/interceptors/base-url.interceptor';
import { HttpErrorInterceptor } from './app/core/interceptors/http-error.interceptor';
import { RECAPTCHA_SETTINGS, RecaptchaSettings } from './app/shared/components/recaptcha';
import { OverlayContainer, FullscreenOverlayContainer } from '@angular/cdk/overlay';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { CustomRouteReuseStrategy } from './app/core/strategies';
import { ROUTER_LOADER_CONFIG, RouterLoaderModule } from './app/shared/components/router-loader';
import { withHttpCacheInterceptor, provideHttpCache } from '@ngneat/cashew';
import { HTTP_CACHE_TTL } from './environments/config';
import { cloneDeep } from 'lodash-es';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { routes } from './app/app.routes';
import { ServiceWorkerModule } from '@angular/service-worker';
import { TranslocoRootModule } from './app/transloco-root.module';
import { HomeLayoutModule } from './app/shared/layouts/home-layout';
import { ToastModule } from 'primeng/toast';
import { AppComponent } from './app/app.component';
import { OverlayPanelModule } from './app/shared/directives/overlay-panel';
import { MarkdownPipeModule } from './app/shared/pipes/markdown-pipe';
import { HtmlPipeModule } from './app/shared/pipes/html-pipe';
import { PermissionPipeModule } from './app/shared/pipes/permission-pipe';
import { MediaFilterModule } from './app/shared/components/media-filter';
import { RecaptchaModule } from './app/shared/components/recaptcha';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        provideZoneChangeDetection(),
        provideRouter(routes),
        importProvidersFrom(BrowserModule, BrowserAnimationsModule, ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: environment.production,
            registrationStrategy: 'registerWhenStable:30000'
        }), TranslocoRootModule, RouterLoaderModule, HomeLayoutModule, ToastModule, OverlayPanelModule, MarkdownPipeModule, HtmlPipeModule, PermissionPipeModule, MediaFilterModule, RecaptchaModule),
        MessageService,
        DialogService,
        providePrimeNG({
            ripple: true,
            theme: {
                preset: MdDarkIndigo,
                options: {
                    prefix: 'p',
                    darkModeSelector: '.p-dark',
                    cssLayer: {
                        name: 'primeng',
                        order: 'base, primeng, components, utilities'
                    }
                }
            }
        }),
        {
            provide: APP_INITIALIZER,
            useFactory: AppInitializer,
            multi: true,
            deps: [AuthService]
        },
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
            useClass: FullscreenOverlayContainer,
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
        })
    ]
})
  .catch(err => console.error(err));
