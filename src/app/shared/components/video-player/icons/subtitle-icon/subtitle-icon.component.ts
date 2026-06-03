import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
    selector: 'player-subtitle-icon',
    templateUrl: './subtitle-icon.component.html',
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgIf]
})
export class SubtitleIconComponent {
  @Input() enabled: boolean = false;
}
