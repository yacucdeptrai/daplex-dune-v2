import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'player-play-icon',
    templateUrl: './play-icon.component.html',
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class PlayIconComponent {
  @Input() paused: boolean = false;
}
