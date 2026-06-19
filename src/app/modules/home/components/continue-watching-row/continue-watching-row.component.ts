import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { TranslocoDirective, TRANSLOCO_SCOPE } from '@jsverse/transloco';

import { DestroyService, HistoryService } from '../../../../core/services';
import { HistoryGroupable } from '../../../../core/models';
import { ResumeCardComponent } from './resume-card/resume-card.component';

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
  // Placeholder cards reserve one landscape rail row while loading (≈ the desktop in-view
  // count) so cards swap in with no layout shift; CLS guardrail on the LCP-sensitive home.
  readonly skeletonCells = Array.from({ length: 5 });
  private destroyRef = inject(DestroyRef);

  constructor(private historyService: HistoryService) { }

  ngOnInit(): void {
    this.historyService.findPage({ inProgress: true, limit: 12 })
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe(page => {
        this.results.set(page?.results ?? []);
        this.loading.set(false);
      });
  }
}
