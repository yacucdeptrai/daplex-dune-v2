/**
 * Shared test helpers for the DaPlex frontend Karma/Jasmine suite.
 *
 * These utilities exist to give the auto-scaffolded `should create` / `should be created`
 * specs a *real* TestBed setup (providers + mocks) so they act as a trustworthy safety net
 * for refactoring: they verify a unit's dependency injection wiring and construction, not
 * its rendered template. See the repo refactoring plan for context.
 */
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpCache } from '@ngneat/cashew';
import { ActivatedRoute, convertToParamMap, Params } from '@angular/router';
import { of } from 'rxjs';

/**
 * HttpClient wired to the testing backend. Spread into `providers` for any service or
 * component whose (possibly transitive) dependencies call `HttpClient`.
 */
export const HTTP_TEST_PROVIDERS: (Provider | EnvironmentProviders)[] = [
  provideHttpClient(),
  provideHttpClientTesting()
];

/**
 * `@ngneat/cashew` cache manager provider. Needed by services that inject
 * `HttpCacheManager` (e.g. GenresService, MediaService).
 */
export const HTTP_CACHE_TEST_PROVIDERS: (Provider | EnvironmentProviders)[] = [
  provideHttpCache({ ttl: 0 })
];

/** Minimal stub of `@ngneat/transloco` TranslocoService for units that translate. */
export function mockTranslocoService() {
  return {
    translate: (key: string) => key,
    selectTranslate: (key: string) => of(key),
    selectTranslation: () => of({}),
    selectTranslateObject: () => of({}),
    getTranslation: () => ({}),
    setActiveLang: () => undefined,
    getActiveLang: () => 'en',
    langChanges$: of('en')
  };
}

/** Mock of PrimeNG `DynamicDialogRef`. `close`/`destroy` are spies so callers can assert. */
export function mockDynamicDialogRef() {
  return {
    close: jasmine.createSpy('close'),
    destroy: jasmine.createSpy('destroy'),
    onClose: of(undefined),
    onDestroy: of(undefined),
    onMaximize: of(undefined),
    onChildComponentLoaded: of(undefined)
  };
}

/**
 * Mock of PrimeNG `DynamicDialogConfig`. Pass the `data` object the component reads in its
 * constructor (many dialogs dereference `config.data!.<field>` eagerly).
 */
export function mockDynamicDialogConfig<T = unknown>(data?: T) {
  return {
    data: (data ?? {}) as T,
    header: '',
    closable: true,
    dismissableMask: false
  };
}

/**
 * Mock of PrimeNG `DialogService`. `open` returns a stub `DynamicDialogRef`.
 * `dialogComponentRefMap` is an empty `Map` because many components iterate or look it up
 * in `ngOnDestroy` / `ngAfterViewInit` (e.g. `dialogComponentRefMap.forEach(...)`,
 * `replaceDialogHideMethod` calling `.get(...)`); an empty map keeps those no-ops safe.
 */
export function mockDialogService() {
  return {
    open: jasmine.createSpy('open').and.returnValue(mockDynamicDialogRef()),
    dialogComponentRefMap: new Map()
  };
}

/** Mock of Angular `Router` covering the navigation surface components commonly call. */
export function mockRouter() {
  return {
    navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true)),
    navigateByUrl: jasmine.createSpy('navigateByUrl').and.returnValue(Promise.resolve(true)),
    createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({}),
    serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue(''),
    parseUrl: jasmine.createSpy('parseUrl').and.returnValue({}),
    events: of(),
    url: '/',
    routerState: { snapshot: { url: '/' } }
  };
}

/**
 * Mock of `ActivatedRoute`. Provide `params` / `queryParams` / `data` overrides for units
 * that read route state; both the observable streams and the `snapshot` are populated.
 */
export function mockActivatedRoute(
  opts: { params?: Params; queryParams?: Params; data?: Record<string, unknown> } = {}
) {
  const params = opts.params ?? {};
  const queryParams = opts.queryParams ?? {};
  const data = opts.data ?? {};
  return {
    snapshot: {
      params,
      queryParams,
      data,
      paramMap: convertToParamMap(params),
      queryParamMap: convertToParamMap(queryParams)
    },
    params: of(params),
    queryParams: of(queryParams),
    data: of(data),
    fragment: of(null),
    paramMap: of(convertToParamMap(params)),
    queryParamMap: of(convertToParamMap(queryParams))
  };
}

/** Provider tuple binding the mock `ActivatedRoute` to its injection token. */
export function provideMockActivatedRoute(
  opts?: { params?: Params; queryParams?: Params; data?: Record<string, unknown> }
): Provider {
  return { provide: ActivatedRoute, useValue: mockActivatedRoute(opts) };
}
