import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'player-fit-window-icon',
    templateUrl: './fit-window-icon.component.html',
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class FitWindowIconComponent {
  @Input() active: boolean = false;
}
