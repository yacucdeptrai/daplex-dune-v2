import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
    selector: 'player-fit-window-icon',
    templateUrl: './fit-window-icon.component.html',
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgIf]
})
export class FitWindowIconComponent {
  @Input() active: boolean = false;
}
