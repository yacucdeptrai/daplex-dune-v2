import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, Renderer2 } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntil } from 'rxjs';
import { NgClass } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';

import { HistoryGroupable, Media, UserDetails } from '../../../../../core/models';
import { AuthService, DestroyService } from '../../../../../core/services';
import { ContextMenuTriggerDirective } from '../../../../../shared/directives/cdk-menu-custom/context-menu-trigger/context-menu-trigger.directive';
import { MenuTriggerDirective } from '../../../../../shared/directives/cdk-menu-custom/menu-trigger/menu-trigger.directive';
import { MenuDirective } from '../../../../../shared/directives/cdk-menu-custom/menu/menu.directive';
import { MenuItemDirective } from '../../../../../shared/directives/cdk-menu-custom/menu-item/menu-item.directive';
import { ThumbhashUrlPipe } from '../../../../../shared/pipes/placeholder-pipe/thumbhash-url/thumbhash-url.pipe';
import { StripAriaLevelDirective } from '../../../../../shared/directives/strip-aria-level/strip-aria-level.directive';
import { TimeLeftPipe } from '../time-left.pipe';

// Landscape (16:9) resume card for the signed-in home rail. Distinct from the portrait
// HistoryCardComponent (still used on the user-history page): the image-priority chain,
// over-image gradient + play affordance, and 16:9 layout differ enough to warrant a
// dedicated primitive. Reuses the card's proven seams (resume link, progress bar, quick
// actions). Relies on the rail's component-scoped DestroyService provider (NG0201 boundary).
@Component({
  selector: 'app-resume-card [history]',
  templateUrl: './resume-card.component.html',
  styleUrls: ['./resume-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoDirective, RouterLink, NgClass, LazyLoadImageModule, ProgressBarModule, ButtonModule,
    ContextMenuTriggerDirective, MenuTriggerDirective, MenuDirective, MenuItemDirective, ThumbhashUrlPipe,
    StripAriaLevelDirective, TimeLeftPipe]
})
export class ResumeCardComponent implements OnInit {
  @Input() history!: HistoryGroupable;
  // Id of the off-image metadata line; associated with the card link for screen readers.
  @Input() resumeMetaId?: string;
  @Output() onAddToPlaylist = new EventEmitter<Media>();
  @Output() onPauseAndUnpause = new EventEmitter<{ history: HistoryGroupable, originalEvent: MouseEvent }>();
  @Output() onDelete = new EventEmitter<HistoryGroupable>();
  userId: string | null = null;
  currentUser!: UserDetails | null;

  constructor(public ref: ChangeDetectorRef, private renderer: Renderer2, private route: ActivatedRoute,
    private authService: AuthService, private destroyService: DestroyService) { }

  // Landscape source priority: episode still (TV) → media backdrop (movie) → undefined
  // (the poster-framed fallback renders instead). Thumbnail tier — below the billboard,
  // never the LCP element. url + placeholder derive from the same decision so they can't drift.
  get landscapeUrl(): string | undefined {
    return this.history.episode?.thumbnailStillUrl ?? this.history.media.thumbnailBackdropUrl;
  }

  // Thumbhash placeholder matching whichever landscape source landscapeUrl picked, so the box never reflows.
  get landscapePlaceholder(): string | undefined {
    return this.history.episode?.thumbnailStillUrl
      ? this.history.episode.stillPlaceholder
      : this.history.media.backdropPlaceholder;
  }

  // Episode runtime wins for TV, but a 0/missing episode runtime falls through to the media
  // runtime (|| semantics, matching the portrait card) so it never reaches the progress value.
  get runtime(): number {
    return (this.history.episode?.runtime || this.history.media.runtime);
  }

  // Progress % for the bar; guarded so a 0 runtime can't push Infinity/NaN into aria-valuenow.
  get progress(): number {
    return this.runtime > 0 ? this.history.time / this.runtime * 100 : 0;
  }

  ngOnInit(): void {
    this.route.parent?.paramMap.pipe(takeUntil(this.destroyService)).subscribe(params => {
      this.userId = params.get('id');
      this.ref.markForCheck();
    });
    this.authService.currentUser$.pipe(takeUntil(this.destroyService)).subscribe(user => {
      this.currentUser = user;
      this.ref.markForCheck();
    });
  }

  onHistoryMenuClick(button: HTMLButtonElement, opened: boolean): void {
    this.renderer[opened ? 'removeClass' : 'addClass'](button, 'tw-invisible');
    this.renderer[opened ? 'addClass' : 'removeClass'](button, 'tw-visible');
  }
}
