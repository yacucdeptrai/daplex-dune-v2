import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';

import { WatchProgressService } from './watch-progress.service';
import { AuthService } from './auth.service';
import { UserDetails } from '../models';
import { HTTP_TEST_PROVIDERS } from '../../../testing/test-helpers';

const isHistoryReq = (r: { url: string }) => r.url === 'history';

function build(currentUser$: BehaviorSubject<UserDetails | null>) {
  TestBed.configureTestingModule({
    providers: [
      WatchProgressService,
      { provide: AuthService, useValue: { currentUser$ } },
      ...HTTP_TEST_PROVIDERS
    ]
  });
  return {
    service: TestBed.inject(WatchProgressService),
    http: TestBed.inject(HttpTestingController)
  };
}

const inProgressPage = {
  hasNextPage: false,
  totalResults: 2,
  results: [
    { _id: 'h1', media: { _id: 'm1', runtime: 100 }, time: 25, date: '', paused: false, watched: 0, groupByDate: '' },
    { _id: 'h2', media: { _id: 'm2', runtime: 200 }, episode: { runtime: 50 }, time: 10, date: '', paused: false, watched: 0, groupByDate: '' }
  ]
};

describe('WatchProgressService', () => {
  it('builds a media -> percent map from the in-progress history (movie runtime + episode runtime)', () => {
    const { service, http } = build(new BehaviorSubject<UserDetails | null>({} as UserDetails));

    const req = http.expectOne(r => r.url === 'history' && r.params.get('inProgress') === 'true');
    // API caps the page at 50; requesting more returns HTTP 400 (empty map).
    expect(req.request.params.get('limit')).toBe('50');
    req.flush(inProgressPage);

    // m1: 25/100 = 25%; m2 uses episode.runtime: 10/50 = 20%
    expect(service.progressFor('m1')).toBe(25);
    expect(service.progressFor('m2')).toBe(20);
    expect(service.progressFor('absent')).toBeNull();
    http.verify();
  });

  it('keeps the most-recent episode when a show has multiple in-progress episodes', () => {
    const { service, http } = build(new BehaviorSubject<UserDetails | null>({} as UserDetails));

    // Recency-sorted (date desc): the most-recent episode (90% of ep2) comes first.
    http.expectOne(isHistoryReq).flush({
      hasNextPage: false, totalResults: 2,
      results: [
        { _id: 'a', media: { _id: 'show', runtime: 0 }, episode: { runtime: 100 }, time: 90, date: '2026-06-19', paused: false, watched: 0, groupByDate: '' },
        { _id: 'b', media: { _id: 'show', runtime: 0 }, episode: { runtime: 100 }, time: 10, date: '2026-06-18', paused: false, watched: 0, groupByDate: '' }
      ]
    });

    expect(service.progressFor('show')).toBe(90);
    http.verify();
  });

  it('issues exactly one history request for the whole grid (shareReplay)', () => {
    const { service, http } = build(new BehaviorSubject<UserDetails | null>({} as UserDetails));

    service.progressFor('m1');
    service.progressFor('m2');
    service.progressFor('m1');

    http.expectOne(isHistoryReq).flush(inProgressPage);
    http.verify(); // a second call would fail verification
  });

  it('returns null and fires NO history call when anonymous', () => {
    const { service, http } = build(new BehaviorSubject<UserDetails | null>(null));

    expect(service.progressFor('m1')).toBeNull();
    http.expectNone(isHistoryReq);
    http.verify();
  });

  it('clears the map on sign-out and rebuilds on sign-in (no reload)', () => {
    const user$ = new BehaviorSubject<UserDetails | null>({} as UserDetails);
    const { service, http } = build(user$);

    http.expectOne(isHistoryReq).flush(inProgressPage);
    expect(service.progressFor('m1')).toBe(25);

    user$.next(null);
    expect(service.progressFor('m1')).toBeNull();
    http.expectNone(isHistoryReq);

    user$.next({} as UserDetails);
    http.expectOne(isHistoryReq).flush(inProgressPage);
    expect(service.progressFor('m1')).toBe(25);
    http.verify();
  });
});
