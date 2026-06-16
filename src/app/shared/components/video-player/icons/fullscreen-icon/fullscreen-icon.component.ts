import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';


@Component({
    selector: 'player-fullscreen-icon',
    templateUrl: './fullscreen-icon.component.html',
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet]
})
export class FullscreenIconComponent {
  @Input() active: boolean = false;
}
