import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'player-fullscreen-icon',
    templateUrl: './fullscreen-icon.component.html',
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class FullscreenIconComponent {
  @Input() active: boolean = false;
}
