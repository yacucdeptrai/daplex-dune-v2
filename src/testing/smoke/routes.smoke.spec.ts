/**
 * Route-walk runtime smoke (A3): navigate every leaf route via `RouterTestingHarness`
 * using the REAL lazy route config (`app.routes.ts` → home/auth/media/admin/users),
 * so each route node's own `providers` are exercised in the genuine route injector
 * (this is where the NG0201 trap lives — `ConfirmActionService` etc. are route-scoped,
 * NOT root). `assertNoNgErrors()` per route is the gate (A1 catches what
 * `GlobalErrorHandler` would swallow).
 *
 * 24 leaf routes (`01_gate_analyst_brief.md §2`):
 *   home 1, auth 5, media 6, admin 4, users 9 (= 1 redirect + 8 leaf children;
 *   we walk the navigable leaves and the reuse pairs).
 *
 * Admin/users routes are guarded (`AuthGuard`/`WsActivatorGuard` + `UserPermission`).
 * We set an OWNER user on `AuthService` so the guards pass and the guarded route
 * components actually construct (an unauthenticated walk would redirect to /sign-in
 * before the route node provider graph is resolved, hiding NG0201). HTTP calls hit
 * the testing backend and stay pending — no error, components render empty.
 *
 * 7 reuse routes (CustomRouteReuseStrategy) are walked A→B→A to exercise the
 * detach/reattach path.
 */

import { TestBed } from '@angular/core/testing';
import { Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { provideAppConfigForTest } from '../app-config-test';
import { assertNoNgErrors } from '../console-error-guard';
import { routes as appRoutes } from '../../app/app.routes';
import { AuthService } from '../../app/core/services';

/**
 * Resolve the users list endpoints (rated→`ratings`, playlists→`playlists`,
 * history→`history`) with an EMPTY `CursorPaginated<T>` so their list `@for`
 * blocks — guarded by `@if (list && list.results?.length)` — do not render. The
 * page mounts cleanly (no card render, no `track_Id` keying) which is the smoke's
 * goal: prove the route + its injector graph render NG-clean. Feeding fully-shaped
 * card fixtures here would couple the gate to each card's deep nested contract
 * (RatingDetails/Playlist/HistoryGroupable) — the wrong layer for a route smoke.
 *
 * TARGETED to these 3 endpoints only: other pending requests (media lists,
 * featured, etc.) stay unflushed exactly as before (already green with pending
 * data); flushing them with a foreign body would inject the wrong shape and throw.
 */
const USERS_LIST_ENDPOINTS = /\/?(ratings|playlists|history)(\?|$)/;
const EMPTY_PAGE = { hasNextPage: false, totalResults: 0, results: [] };

function flushPendingListRequests(httpMock: HttpTestingController): void {
  for (const req of httpMock.match((r) => USERS_LIST_ENDPOINTS.test(r.url))) {
    if (!req.cancelled) {
      req.flush(EMPTY_PAGE);
    }
  }
}

/** Minimal owner user so AuthGuard passes for admin/users routes. */
const OWNER_USER: any = {
  _id: 'owner1',
  username: 'owner',
  nickname: 'Owner',
  email: 'owner@daplex.io',
  owner: true,
  granted: [],
  banned: false
};

/** Public leaf routes (no guard) — always navigable. */
const PUBLIC_ROUTES = [
  '/',
  '/sign-in',
  '/sign-up',
  '/confirm-email',
  '/forgot-password',
  '/reset-password',
  '/search',
  '/list/movie',
  '/list/tv/popular',
  '/details/abc',
  '/playlists/pl1',
  '/watch/abc'
];

/** Guarded leaf routes (need an authed owner user). */
const GUARDED_ROUTES = [
  '/admin/genres',
  '/admin/productions',
  '/admin/media',
  '/admin/audit-log',
  '/users/settings',
  '/users/settings/profile',
  '/users/settings/privacy',
  '/users/settings/media',
  '/users/settings/subtitle',
  '/users/u1/history',
  '/users/u1/playlists',
  '/users/u1/rated'
];

/** 7 reuse routes walked A→B→A (CustomRouteReuseStrategy detach/reattach). */
const REUSE_PAIRS: Array<[string, string]> = [
  ['/search', '/details/abc'],
  ['/list/movie', '/search'],
  ['/list/tv/popular', '/search'],
  ['/playlists/pl1', '/search'],
  ['/users/u1/history', '/users/u1/playlists'],
  ['/users/u1/playlists', '/users/u1/rated'],
  ['/users/u1/rated', '/users/u1/history']
];

describe('Runtime smoke: walk all lazy leaf routes via RouterTestingHarness', () => {
  let harness: RouterTestingHarness;
  let httpMock: HttpTestingController;

  async function setup(routes: Routes = appRoutes, authed = false): Promise<void> {
    // provideAppConfigForTest owns the router config (with withComponentInputBinding,
    // per the brief) — passing routes here wires the REAL lazy route providers so the
    // route-injector NG0201 zone stays honest.
    TestBed.configureTestingModule({
      providers: provideAppConfigForTest(routes)
    });
    if (authed) {
      TestBed.inject(AuthService).currentUser = OWNER_USER;
    }
    httpMock = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  }

  /** Navigate, feed real-shaped list data, render, settle. */
  async function go(path: string): Promise<void> {
    await harness.navigateByUrl(path);
    harness.detectChanges();
    flushPendingListRequests(httpMock);
    harness.detectChanges();
  }

  it('counts 24 leaf routes (matches analyst inventory)', () => {
    expect(PUBLIC_ROUTES.length + GUARDED_ROUTES.length).toBe(24);
  });

  describe('public routes (no auth)', () => {
    for (const path of PUBLIC_ROUTES) {
      it(`navigates ${path} without NG framework errors`, async () => {
        await setup();
        await go(path);
        assertNoNgErrors();
      });
    }
  });

  describe('guarded routes (owner authed)', () => {
    for (const path of GUARDED_ROUTES) {
      it(`navigates ${path} without NG framework errors`, async () => {
        await setup(appRoutes, true);
        await go(path);
        assertNoNgErrors();
      });
    }
  });

  describe('reuse routes A→B→A (CustomRouteReuseStrategy)', () => {
    for (const [a, b] of REUSE_PAIRS) {
      it(`walks ${a} → ${b} → ${a} without NG framework errors`, async () => {
        await setup(appRoutes, true);
        await go(a);
        await go(b);
        await go(a);
        assertNoNgErrors();
      });
    }
  });
});
