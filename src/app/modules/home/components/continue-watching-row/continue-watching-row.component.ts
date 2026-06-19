import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { TranslocoDirective, TRANSLOCO_SCOPE } from '@jsverse/transloco';

import { DestroyService, HistoryService } from '../../../../core/services';
import { HistoryGroupable } from '../../../../core/models';
import { ResumeCardComponent } from './resume-card/resume-card.component';

// Most a returning viewer scans before it stops feeling like "where I left off".
const RAIL_CAP = 3;

// Resume rail: owns the in-progress history call (fires only when instantiated, i.e.
// signed in) and composes the shared history card. HistoryService is component-scoped
// here (it is not providedIn:'root') so the rail is the only place the call lives.
@Component({
  selector: 'app-continue-watching-row',
  templateUrl: './continue-watching-row.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // DestroyService is component-scoped and required by the composed ResumeCardComponent.
  providers: [HistoryService, DestroyService, { provide: TRANSLOCO_SCOPE, useValue: ['media', 'home'] }],
  imports: [TranslocoDirective, ResumeCardComponent]
})
export class ContinueWatchingRowComponent implements OnInit {
  loading = signal(true);
  results = signal<HistoryGroupable[]>([]);
  // Placeholder cards reserve the rail's height while loading so cards swap in with no
  // layout shift; CLS guardrail on the LCP-sensitive home. Count matches the RAIL_CAP.
  readonly skeletonCells = Array.from({ length: RAIL_CAP });
  private destroyRef = inject(DestroyRef);

  constructor(private historyService: HistoryService) { }

  ngOnInit(): void {
    // Keep a generous fetch: a show with two in-progress episodes still yields one card,
    // so capping the request at 3 could leave the rail under-filled.
    this.historyService.findPage({ inProgress: true, limit: 12 })
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe(page => {
        this.results.set(this.collapse(page?.results ?? []));
        this.loading.set(false);
      });
  }

  // Collapse a TV show's multiple in-progress episodes to one card, then cap the rail.
  // The list is recency-sorted (date-desc), so the first occurrence per media is the
  // most-recently-watched episode; dedup BEFORE the cap so a single show can't crowd it out.
  private collapse(results: HistoryGroupable[]): HistoryGroupable[] {
    const seen = new Set<string>();
    const deduped = results.filter(h => {
      const id = h.media._id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    return deduped.slice(0, RAIL_CAP);
  }
}
