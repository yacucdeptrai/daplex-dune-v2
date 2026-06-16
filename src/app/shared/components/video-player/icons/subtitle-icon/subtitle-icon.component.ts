import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';


@Component({
    selector: 'player-subtitle-icon',
    templateUrl: './subtitle-icon.component.html',
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet]
})
export class SubtitleIconComponent {
  @Input() enabled: boolean = false;
}
