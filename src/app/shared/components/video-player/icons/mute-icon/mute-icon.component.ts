import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';


@Component({
    selector: 'player-mute-icon',
    templateUrl: './mute-icon.component.html',
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet]
})
export class MuteIconComponent {
  @Input() muted: boolean = false;
  @Input() volume: number = 0;
}
