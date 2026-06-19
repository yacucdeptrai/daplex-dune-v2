import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, Renderer2 } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntil } from 'rxjs';

import { HistoryGroupable, Media, UserDetails } from '../../../../core/models';
import { AuthService, DestroyService } from '../../../../core/services';
import { TranslocoDirective } from '@jsverse/transloco';
import { ContextMenuTriggerDirective } from '../../../../shared/directives/cdk-menu-custom/context-menu-trigger/context-menu-trigger.directive';
import { NgClass } from '@angular/common';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { MenuTriggerDirective } from '../../../../shared/directives/cdk-menu-custom/menu-trigger/menu-trigger.directive';
import { MenuDirective } from '../../../../shared/directives/cdk-menu-custom/menu/menu.directive';
import { MenuItemDirective } from '../../../../shared/directives/cdk-menu-custom/menu-item/menu-item.directive';
import { ThumbhashUrlPipe } from '../../../../shared/pipes/placeholder-pipe/thumbhash-url/thumbhash-url.pipe';
import { StripAriaLevelDirective } from '../../../../shared/directives/strip-aria-level/strip-aria-level.directive';

@Component({
    selector: 'app-history-card [history]',
    templateUrl: './history-card.component.html',
    styleUrls: ['./history-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslocoDirective, ContextMenuTriggerDirective, RouterLink, LazyLoadImageModule, ProgressBarModule, ButtonModule, MenuTriggerDirective, MenuDirective, MenuItemDirective, NgClass, ThumbhashUrlPipe, StripAriaLevelDirective]
})
export class HistoryCardComponent implements OnInit {
  @Input() history!: HistoryGroupable;
  // Optional id of an external element describing the resume context (e.g. the rail's
  // "Episode N · mm:ss left" line); associated with the card link for screen readers.
  @Input() resumeMetaId?: string;
  @Output() onAddToPlaylist = new EventEmitter<Media>();
  @Output() onPauseAndUnpause = new EventEmitter<{ history: HistoryGroupable, originalEvent: MouseEvent }>();
  @Output() onDelete = new EventEmitter<HistoryGroupable>();
  userId: string | null = null;
  currentUser!: UserDetails | null;

  constructor(public ref: ChangeDetectorRef, private renderer: Renderer2, private route: ActivatedRoute,
    private authService: AuthService, private destroyService: DestroyService) { }

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
