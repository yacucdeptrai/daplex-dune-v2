import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';


@Component({
    selector: 'player-play-icon',
    templateUrl: './play-icon.component.html',
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet]
})
export class PlayIconComponent {
  @Input() paused: boolean = false;
}
