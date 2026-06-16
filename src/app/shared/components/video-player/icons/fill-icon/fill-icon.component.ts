import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';


@Component({
    selector: 'player-fill-icon',
    templateUrl: './fill-icon.component.html',
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet]
})
export class FillIconComponent {
  @Input() active: boolean = false;
}
