import { HttpClient } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, of, shareReplay, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from './auth.service';
import { CursorPaginated, HistoryGroupable } from '../models';

// Enough in-progress rows to cover a browse grid (API caps the page at 50).
const IN_PROGRESS_LIMIT = 50;

/**
 * Grid-wide watch-progress cross-reference (W2.2). Fetches the in-progress history
 * once per signed-in session and exposes an O(1) `mediaId -> percent` lookup so any
 * browse poster can overlay its resume bar without a per-card call.
 *
 * Root-scoped: depends only on root services (HttpClient + AuthService) — it uses the
 * root HTTP layer directly rather than the component-scoped HistoryService (avoids NG0201).
 */
@Injectable({ providedIn: 'root' })
export class WatchProgressService {
  // Empty map while anonymous (no call fires); rebuilt on each sign-in, cleared on sign-out.
  private readonly progress: Signal<Map<string, number>>;

  constructor(private http: HttpClient, private authService: AuthService) {
    const stream = this.authService.currentUser$.pipe(
      switchMap(user => (user ? this.fetchProgressMap() : of(new Map<string, number>()))),
      shareReplay(1)
    );
    this.progress = toSignal(stream, { initialValue: new Map<string, number>() });
  }

  /** Resume percent (0-100) for a media id, or null when none / anonymous. */
  progressFor(mediaId: string): number | null {
    return this.progress().get(mediaId) ?? null;
  }

  private fetchProgressMap(): Observable<Map<string, number>> {
    return this.http
      .get<CursorPaginated<HistoryGroupable>>('history', { params: { inProgress: true, limit: IN_PROGRESS_LIMIT } })
      .pipe(map(page => this.toPercentMap(page.results)));
  }

  private toPercentMap(rows: HistoryGroupable[]): Map<string, number> {
    // Rows are recency-sorted (date desc); keep the FIRST per media so the most-recently
    // watched episode's progress wins when a show has multiple in-progress episodes.
    return rows.reduce((acc, row) => {
      const runtime = (row.episode && row.episode.runtime) || row.media.runtime;
      if (runtime > 0 && !acc.has(row.media._id)) acc.set(row.media._id, (row.time / runtime) * 100);
      return acc;
    }, new Map<string, number>());
  }
}
