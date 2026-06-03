import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
    selector: 'player-fill-icon',
    templateUrl: './fill-icon.component.html',
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgIf]
})
export class FillIconComponent {
  @Input() active: boolean = false;
}
