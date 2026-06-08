import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, Renderer2 } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntil } from 'rxjs';

import { HistoryGroupable, Media, UserDetails } from '../../../../core/models';
import { AuthService, DestroyService } from '../../../../core/services';
import { TranslocoDirective } from '@jsverse/transloco';
import { ContextMenuTriggerDirective } from '../../../../shared/directives/cdk-menu-custom/context-menu-trigger/context-menu-trigger.directive';
import { NgIf, NgClass } from '@angular/common';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { MenuTriggerDirective } from '../../../../shared/directives/cdk-menu-custom/menu-trigger/menu-trigger.directive';
import { MenuDirective } from '../../../../shared/directives/cdk-menu-custom/menu/menu.directive';
import { MenuItemDirective } from '../../../../shared/directives/cdk-menu-custom/menu-item/menu-item.directive';
import { ThumbhashUrlPipe } from '../../../../shared/pipes/placeholder-pipe/thumbhash-url/thumbhash-url.pipe';

@Component({
    selector: 'app-history-card [history]',
    templateUrl: './history-card.component.html',
    styleUrls: ['./history-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslocoDirective, ContextMenuTriggerDirective, RouterLink, NgIf, LazyLoadImageModule, ProgressBarModule, ButtonModule, MenuTriggerDirective, MenuDirective, MenuItemDirective, NgClass, ThumbhashUrlPipe]
})
export class HistoryCardComponent implements OnInit {
  @Input() history!: HistoryGroupable;
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
